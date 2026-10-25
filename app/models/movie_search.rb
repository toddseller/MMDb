module MovieSearch
  # A movie costs one Apple request; 20 matches TMDB's page size.
  APPLE_LIMIT = 20
  EDGE_SPACE = /\A[[:space:]]+|[[:space:]]+\z/

  # stored: database rows, read by the caller because the lookups below run on other threads and must not touch ActiveRecord.
  def self.titles(term, stored = [])
    apple, tmdb = InParallel.map([:apple, :tmdb], limit: 2) { |source| source == :apple ? apple_movies(term) : tmdb_movies(term) }
    # Merge only once every source has answered, so the database, then Apple, then TMDB order holds.
    movies = stored.to_a
    ((apple || []) + (tmdb || [])).each { |movie| movies << movie if movies.none? { |kept| same_movie?(kept, movie) } }
    # sort_by is not stable, so the merge position breaks ties within a year.
    movies.each_with_index.sort_by { |movie, index| [movie[:year].to_s, index] }.map(&:first)
  end

  def self.same_movie?(a, b)
    Match.same_name?(a[:title], b[:title]) && Match.same_year?(a[:year], b[:year]) && Match.same_director?(a[:director], b[:director])
  end

  def self.director_check(director)
    director.to_s.split(/[[:space:]]+/).last.to_s
  end

  def self.apple_movies(term)
    InParallel.map(AppleTv.matches(term, 'Movie', APPLE_LIMIT)) { |id, store| apple_movie(id, store) }.compact
  end

  def self.apple_movie(id, store)
    request = AppleTv.view('product/' + id, store)
    return unless request.code == 200 && request['data'] && request['data']['content']
    content = request['data']['content']
    credits = Hash.new { |hash, type| hash[type] = [] }
    (request['data']['roles'] || []).each do |credit|
      type = credit['type'] == 'Voice' ? 'Actor' : credit['type']
      credits[type] << credit['personName'].gsub(EDGE_SPACE, '') if credit['personName']
    end
    cover = content['images'] && content['images']['coverArt']
    director = Movie.get_first_six(credits['Director'])
    {title: content['title'], plot: content['description'] ? Movie.get_plot(content['description']) : '',
     poster: cover ? cover['url'].gsub(/({w}x{h}.{f})/, cover['width'].to_s + 'x' + cover['height'].to_s + '.jpg') : '',
     year: content['releaseDate'] ? Time.at(content['releaseDate'] / 1000).to_datetime.year.to_s : '',
     actors: Movie.get_first_six(credits['Actor']), director: director, genre: content['genres'] ? content['genres'][0]['name'] : '',
     producer: Movie.get_first_six(credits['Producer']), rating: content['rating'] ? content['rating']['displayName'] : '',
     runtime: content['duration'] ? (content['duration'] / 60).to_s : '', studio: content['studio'] || '',
     writer: Movie.get_first_six(credits['Writer']), director_check: director_check(credits['Director'].first)}
  end

  def self.tmdb_movies(term)
    search = Tmdb.get('search/movie', query: term)
    return [] unless search[:code] == '200'
    InParallel.map(search[:body]['results'].select { |movie| movie['poster_path'] }) { |movie| tmdb_movie(movie) }.compact
  end

  def self.tmdb_movie(movie)
    response = Tmdb.get('movie/' + movie['id'].to_s, append_to_response: 'credits,releases')
    return unless response[:code] == '200'
    details = response[:body]
    director = Movie.get_director(details)
    {title: movie['title'], plot: Movie.get_plot(movie['overview']), poster: 'https://image.tmdb.org/t/p/w342' + movie['poster_path'],
     year: details['release_date'].to_s[0, 4], actors: Movie.get_actors(details), director: director, genre: Movie.get_genres(details),
     producer: Movie.get_producers(details), rating: Movie.get_rating(details), runtime: details['runtime'] ? details['runtime'].to_s : '0',
     studio: Movie.get_studio(details), writer: Movie.get_writers(details), director_check: director_check(director)}
  end
end
