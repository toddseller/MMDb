require 'csv'

# One-off repair of movies whose producer holds a copy of their rating (4,201 of them in October 2026; nothing has
# written one since early 2024). A dry run looks each movie up again and reports; the reviewed report is then applied.
module ProducerRepair
  # A lookup that errored rather than found nothing: its movie must be left alone, not cleared.
  class Failed < StandardError; end

  # Apple's rate limit outlasted the wait. Failing each movie while it holds would waste the rest of the run, so the
  # run stops instead and the next dry run takes up whatever is still affected.
  class Limited < StandardError; end

  def self.affected = Movie.where('producer = rating').where.not(rating: ['', nil]).order(:id)

  # each, when given, gets every row as soon as it's built, so a long run can write as it goes.
  def self.plan(movies = affected, &each)
    movies.map { |movie| row(movie).tap { |row| each&.call(row) } }
  end

  COLUMNS = %i[id title year source matched_by old_producer new_producer old_poster new_poster]
  MATCHES = %w[artwork title_year_director other_source unmatched failed]

  # Each row is flushed as it's found, so a run stopped partway (it takes about an hour) still leaves a usable report.
  def self.write_plan(path, movies: affected, log: $stdout)
    total = movies.count
    counts = Hash.new(0)
    tally = -> { MATCHES.map { |match| "#{counts[match]} #{match}" }.join(', ') }
    rows = []
    CSV.open(path, 'w', write_headers: true, headers: COLUMNS) do |csv|
      plan(movies) do |row|
        rows << row
        log.puts "Failed #{row[:id]} #{row[:title]}: #{row[:reason]}" if row[:matched_by] == 'failed'
        csv << row.values_at(*COLUMNS)
        csv.flush
        counts[row[:matched_by]] += 1
        done = counts.values.sum
        log.puts "#{done} of #{total} movies" if (done % 100).zero? && done < total
      end
    end
    log.puts "#{total} movies: #{tally.call}"
  rescue Limited
    log.puts "Apple's rate limit stopped the run after #{rows.size} movies: #{tally.call}"
  ensure
    write_covers("#{path}.html", rows.reject { |row| row[:new_poster].empty? }) if rows
  end

  # About 1,300 cover changes are easier to judge by eye than as addresses, so they get a page beside the CSV.
  # The CSV stays the record: a cover is kept by blanking its new_poster there.
  COVER_PAGE = ERB.new(<<~HTML, trim_mode: '-')
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <title>Cover changes</title>
    <style>
      body { margin: 24px; font: 14px/1.4 system-ui, sans-serif; color: #222; background: #fff; }
      table { border-collapse: collapse; }
      th, td { padding: 8px 16px 8px 0; border-bottom: 1px solid #ddd; text-align: left; vertical-align: middle; }
      img { display: block; width: 116px; height: 174px; object-fit: cover; background: #eee; }
    </style>
    </head>
    <body>
    <h1>Cover changes: <%= h covers.size %> movies</h1>
    <p>To keep a movie's current cover, blank its new_poster in the CSV, or delete its row.</p>
    <table>
    <thead><tr><th>id</th><th>Movie</th><th>Current cover</th><th>New cover</th></tr></thead>
    <tbody>
    <%- covers.each do |row| -%>
    <tr><td><%= h row[:id] %></td><td><%= h row[:title] %> (<%= h row[:year] %>)</td><td><img src="<%= h thumbnail(row[:old_poster]) %>" alt="" loading="lazy"></td><td><img src="<%= h thumbnail(row[:new_poster]) %>" alt="" loading="lazy"></td></tr>
    <%- end -%>
    </tbody>
    </table>
    </body>
    </html>
  HTML

  extend ERB::Util

  def self.write_covers(path, covers) = File.write(path, COVER_PAGE.result(binding))

  def self.thumbnail(poster) = Movie.new(poster: poster).thumbnail

  def self.apply_file(path, log: $stdout)
    rows = CSV.read(path, headers: true).map { |row| row.to_h.transform_keys(&:to_sym) }
    result = apply(rows)
    log.puts "Changed since the dry run, left alone: #{result[:changed].join(', ')}" if result[:changed].any?
    log.puts "#{result[:written].size} written, #{result[:failed].size} failed, #{result[:changed].size} changed since the dry run"
  end

  # Writes exactly what the reviewed report says, without asking any source again, so what lands is what was read.
  # A movie edited by hand since the dry run is left alone: its producer no longer matches, or its cover changed.
  # update_columns skips the callbacks and updated_at, as only these two fields are this repair's to change.
  def self.apply(rows)
    movies = Movie.where(id: rows.map { |row| row[:id] }).index_by(&:id)
    result = { written: [], changed: [], failed: [] }
    # requires_new rolls this back as a unit even inside another transaction, such as the one each spec runs in.
    Movie.transaction(requires_new: true) do
      rows.each do |row|
        movie = movies[row[:id].to_i]
        next result[:failed] << row[:id].to_i if row[:matched_by] == 'failed'
        unless movie && movie.producer == movie.rating && movie.producer == row[:old_producer].to_s && movie.poster.to_s == row[:old_poster].to_s
          next result[:changed] << row[:id].to_i
        end
        changes = { producer: row[:new_producer].to_s }
        changes[:poster] = row[:new_poster] unless row[:new_poster].to_s.empty?
        movie.update_columns(changes)
        result[:written] << movie.id
      end
    end
    result
  end

  # The poster tells where the movie was added from, so its credits are looked up there first.
  def self.source(poster)
    case URI(poster.to_s).host.to_s
    when /mzstatic\.com\z/ then 'apple'
    when 'image.tmdb.org', 'www.themoviedb.org' then 'tmdb'
    else 'other'
    end
  rescue URI::InvalidURIError
    'other'
  end

  def self.row(movie)
    found = lookup(movie)
    { id: movie.id, title: movie.title, year: movie.year, source: source(movie.poster),
      matched_by: found ? found[:matched_by] : 'unmatched', old_producer: movie.producer, new_producer: found&.dig(:producers) || '',
      old_poster: movie.poster, new_poster: found&.dig(:poster) || '', reason: found&.dig(:reason) }
  end

  # The other source is asked only when the first found nothing; a failure leaves the movie for a later run instead.
  # A cover comes only from the poster's own source, so a match in the other source never changes the poster.
  def self.lookup(movie)
    first, other = source(movie.poster) == 'apple' ? %i[apple tmdb] : %i[tmdb apple]
    public_send(first, movie) || public_send(other, movie)&.merge(matched_by: 'other_source', poster: nil)
  rescue Failed => e
    { matched_by: 'failed', reason: e.message }
  end

  # A TMDB poster is the same image at any size, so it is compared by file name alone.
  def self.file_name(path) = path.to_s[%r{/([^/]+)\z}, 1]

  # The movie on TMDB: by its own poster, by an older poster of a same-year result, or by title, year and director.
  def self.tmdb(movie)
    poster = file_name(movie.poster) if source(movie.poster) == 'tmdb'
    results = tmdb_get('search/movie', query: movie.title)['results'] || []
    hit = poster && results.find { |result| file_name(result['poster_path']) == poster }
    return tmdb_credits(hit['id'], 'artwork') if hit
    same = results.select { |result| Match.same_name?(movie.title, result['title'].to_s) && Match.same_year?(movie.year, result['release_date'].to_s[0, 4]) }
    hit = poster && same.find { |result| (tmdb_get("movie/#{result['id']}/images")['posters'] || []).any? { |image| file_name(image['file_path']) == poster } }
    return tmdb_credits(hit['id'], 'artwork') if hit
    same.each do |result|
      found = tmdb_credits(result['id'], 'title_year_director')
      return found if Match.same_director?(movie.director, found[:director])
    end
    nil
  end

  def self.tmdb_credits(id, matched_by)
    details = tmdb_get("movie/#{id}", append_to_response: 'credits')
    { matched_by: matched_by, producers: Movie.get_producers(details), director: Movie.get_director(details) }
  end

  # Apple publishes no rate limit for these endpoints. At 0.2 seconds it limited the first full run after about 430
  # movies, so a second apart keeps a run of thousands near 60 requests a minute.
  APPLE_PAUSE = 1
  APPLE_RESULTS = 10

  # An Apple cover is the same image on any isN host and at any size: compare the path between /image/thumb/ and the size.
  def self.cover_path(url) = url.to_s[%r{/image/thumb/(.+)/[^/]+\z}, 1]

  # Most movies are in the US store, so the others are searched only while no store has found the movie. Any store's
  # failure means a later "nothing found" can't be trusted, so it fails the lookup.
  def self.apple(movie)
    failure = nil
    AppleTv::STORES.each do |store|
      found = apple_in_store(movie, store)
      return found if found
    rescue Failed => e
      failure ||= e
    end
    raise failure if failure
  end

  def self.apple_in_store(movie, store)
    search = apple_get { HTTParty.get(AppleTv::BASE + 'search/incremental?sf=' + store + AppleTv::PARAMS + '&q=' + CGI.escape(movie.title)) }
    items = (search.dig('data', 'canvas', 'shelves') || []).flat_map { |shelf| shelf['items'] || [] }
    items.select { |item| item['type'] == 'Movie' && item['id'] && item['title'] }.first(APPLE_RESULTS).each do |item|
      found = apple_match(movie, apple_get { AppleTv.view('product/' + item['id'], store) }['data'] || {})
      return found if found
    end
    nil
  end

  def self.apple_match(movie, data)
    content = data['content'] || {}
    cover = content.dig('images', 'coverArt') || {}
    names = ->(type) { (data['roles'] || []).select { |role| role['type'] == type }.map { |role| role['personName'].to_s.gsub(MovieSearch::EDGE_SPACE, '') } }
    producers = Movie.get_first_six(names.call('Producer'))
    return { matched_by: 'artwork', producers: producers } if cover_path(cover['url']) && cover_path(cover['url']) == cover_path(movie.poster)
    year = content['releaseDate'] ? Time.at(content['releaseDate'] / 1000).utc.year.to_s : ''
    same = Match.same_name?(movie.title, content['title'].to_s) && Match.same_year?(movie.year, year) && Match.same_director?(movie.director, names.call('Director').first)
    # Built as MovieSearch.apple_movie builds a cover when a movie is added; without a size it would end in /x.jpg.
    sized = cover['url'] && cover['width'] && cover['height']
    poster = sized ? cover['url'].sub('{w}x{h}.{f}', "#{cover['width']}x#{cover['height']}.jpg") : ''
    { matched_by: 'title_year_director', producers: producers, poster: poster } if same
  end

  # A 429 is Apple's rate limit, not an answer about the movie. One wait covers a brief limit; in October 2026 one held
  # even for single requests, and waiting longer would only have delayed stopping.
  LIMIT_WAIT = 300

  def self.apple_get(&request)
    sleep APPLE_PAUSE
    response = apple_request(&request)
    if response.code == 429
      sleep LIMIT_WAIT
      response = apple_request(&request)
      raise Limited, 'Apple answered 429 again after a five-minute wait' if response.code == 429
    end
    raise Failed, "Apple answered #{response.code}" unless response.code == 200
    # A busy Apple can answer 200 with an HTML page, which isn't an answer about the movie.
    raise Failed, 'Apple answered without JSON' unless response.parsed_response.is_a?(Hash)
    response.parsed_response
  end

  def self.apple_request
    yield
  rescue StandardError => e
    raise Failed, "Apple: #{e.message}"
  end

  def self.tmdb_get(path, params = {})
    response = begin
      Tmdb.get(path, params)
    rescue StandardError => e
      raise Failed, "TMDB #{path}: #{e.message}"
    end
    raise Failed, "TMDB #{path} answered #{response[:code]}" unless response[:code] == '200'
    response[:body]
  end
end
