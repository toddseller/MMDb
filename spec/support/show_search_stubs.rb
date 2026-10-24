# Apple and TMDB stand-ins shaped like the real responses, so get_series runs end to end without the network.
module ShowSearchStubs
  STORES = %w[143441 143444 143455 143460]
  JSON_HEADERS = { 'Content-Type' => 'application/json' }

  def json(body) = { status: 200, body: body.to_json, headers: JSON_HEADERS }

  # Seconds each source waits before answering, so a test can make one source slow.
  def delays = @delays ||= Hash.new(0)

  def answer(source, &body) = proc { |request| sleep(delays[source]); json(body.call(request)) }

  def stub_apple_search(term, store: '143441', shows: [])
    items = shows.map { |id, title| { type: 'Show', id: id, title: title } }
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?})
      .with(query: hash_including('sf' => store, 'q' => term))
      .to_return(&answer(:apple) { { data: { canvas: { shelves: [{ items: items }] } } } })
  end

  def apple_episodes(id, seasons)
    { data: {
      seasonSummaries: seasons.map { |number, count| { label: "Season #{number}", episodeCount: count } },
      seasons: seasons.map { |number, _| { id: "#{id}-s#{number}", seasonNumber: number, images: { coverArt: { url: "https://is1-ssl.mzstatic.com/#{id}/#{number}/{w}x{h}.{f}" } } } }
    } }
  end

  def stub_apple_show(id, title:, seasons:, year: 2021)
    released = Time.utc(year, 1, 8).to_i * 1000
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/view/show/#{Regexp.escape(id)}\?})
      .to_return(&answer(:apple) { { data: { content: { title: title, description: "#{title} on Apple", genres: [{ name: 'Drama' }], rating: { displayName: 'TV-MA' }, releaseDate: released } } } })
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/view/show/#{Regexp.escape(id)}/episodes\?})
      .to_return(&answer(:apple) { apple_episodes(id, seasons) })
  end

  def stub_tmdb_search(term, results)
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/tv\?})
      .with(query: hash_including('query' => term))
      .to_return(&answer(:tmdb) { { results: results.map { |id, name, year| { id: id, name: name, overview: "#{name} on TMDB", first_air_date: "#{year || 2021}-01-08" } } } })
  end

  def tmdb_season(id, name, number) = { season_number: number, poster_path: "/#{id}-#{number}.jpg", overview: "#{name} season #{number}" }

  # Answers both the per-season requests and season/N appended to the series request.
  def stub_tmdb_show(id, name:, seasons:)
    body = { id: id, name: name, genres: [{ name: 'Crime' }], content_ratings: { results: [{ iso_3166_1: 'US', rating: 'TV-14' }] },
             seasons: ([0] + seasons).map { |number| { season_number: number } } }
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/tv/#{id}\?}).to_return(&answer(:tmdb) do |request|
      asked = request.uri.query_values['append_to_response'].to_s.scan(%r{season/(\d+)}).flatten.map(&:to_i)
      body.merge((asked & seasons).to_h { |number| ["season/#{number}", tmdb_season(id, name, number)] })
    end)
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/tv/#{id}/season/(\d+)\z}).to_return(&answer(:tmdb) do |request|
      tmdb_season(id, name, request.uri.path[/\d+\z/].to_i)
    end)
  end

  def search_requests(pattern) = WebMock::RequestRegistry.instance.requested_signatures.hash.select { |sig, _| sig.uri.to_s =~ pattern }.values.sum
end
