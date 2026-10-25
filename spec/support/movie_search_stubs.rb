require_relative 'show_search_stubs'

# Apple and TMDB movie stand-ins shaped like the real responses, so get_titles runs end to end without the network.
module MovieSearchStubs
  include ShowSearchStubs

  def stub_movie_sources_empty
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?}).to_return(json(data: { canvas: { shelves: [] } }))
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/movie\?}).to_return(json(results: []))
  end

  # items: [id, title] pairs for movies, or full item hashes for anything else.
  def stub_apple_movie_search(term, store: '143441', items: [])
    items = items.map { |item| item.is_a?(Hash) ? item : { type: 'Movie', id: item[0], title: item[1] } }
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?})
      .with(query: hash_including('sf' => store, 'q' => term))
      .to_return(&answer(:apple) { { data: { canvas: { shelves: [{ items: items }] } } } })
  end

  def apple_product(title:, year:, director:)
    roles = [{ type: 'Actor', personName: 'Sylvester Stallone' }]
    roles << { type: 'Director', personName: director } if director
    { data: { content: { title: title, description: "#{title} on Apple", releaseDate: Time.utc(year, 6, 1).to_i * 1000, genres: [{ name: 'Drama' }],
                         rating: { displayName: 'PG' }, duration: 7200, studio: 'United Artists',
                         images: { coverArt: { url: "https://is1-ssl.mzstatic.com/image/thumb/#{title.delete(' ')}/{w}x{h}.{f}", width: 2000, height: 3000 } } },
              roles: roles } }
  end

  def stub_apple_movie(id, title:, year:, director: 'John G. Avildsen')
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/view/product/#{Regexp.escape(id)}\?})
      .to_return(&answer(:apple) { apple_product(title: title, year: year, director: director) })
  end

  # movies: [id, title, year] triples; a nil year leaves the release date blank.
  def stub_tmdb_movie_search(term, movies, poster: true)
    results = movies.map { |id, title, year| { id: id, title: title, release_date: "#{year}-12-03", overview: "#{title} on TMDB", poster_path: poster ? "/#{id}.jpg" : nil } }
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/movie\?})
      .with(query: hash_including('query' => term))
      .to_return(&answer(:tmdb) { { results: results } })
  end

  def stub_tmdb_movie(id, title:, year:, director: 'John G. Avildsen')
    crew = director ? [{ name: director, job: 'Director' }] : []
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/movie/#{id}\?}).to_return(&answer(:tmdb) do
      { id: id, title: title, release_date: "#{year}-12-03", runtime: 120, genres: [{ name: 'Drama' }],
        credits: { cast: [{ name: 'Sylvester Stallone' }], crew: crew }, releases: { countries: [{ iso_3166_1: 'US', certification: 'pg' }] },
        production_companies: [{ name: 'Chartoff-Winkler' }] }
    end)
  end
end
