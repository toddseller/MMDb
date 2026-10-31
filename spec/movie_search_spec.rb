describe 'Movie.get_titles' do
  include MovieSearchStubs

  before { stub_movie_sources_empty }

  def store_rocky(director: 'John G. Avildsen') = Movie.create!(title: 'Rocky', year: '1976', director: director)

  def titles(rows) = rows.map { |row| [row[:title], row[:year]] }

  def from_apple?(row) = row[:poster].include?('mzstatic')

  def apple_and_tmdb_rocky(apple_year: 1976, tmdb_year: 1976, apple_director: 'John G. Avildsen')
    stub_apple_movie_search('rocky', items: [['umc.rocky', 'Rocky']])
    stub_apple_movie('umc.rocky', title: 'Rocky', year: apple_year, director: apple_director)
    stub_tmdb_movie_search('rocky', [[1366, 'Rocky', tmdb_year]])
    stub_tmdb_movie(1366, title: 'Rocky', year: tmdb_year)
  end

  it 'returns only database movies when no outside source finds anything' do
    store_rocky

    expect(titles(Movie.get_titles('rocky'))).to eq [['Rocky', '1976']]
  end

  describe 'source priority' do
    it 'keeps the stored movie over Apple and TMDB' do
      store_rocky
      apple_and_tmdb_rocky

      rows = Movie.get_titles('rocky')

      expect(titles(rows)).to eq [['Rocky', '1976']]
      expect(rows.first).to be_a Movie
    end

    it 'keeps Apple over TMDB' do
      apple_and_tmdb_rocky

      rows = Movie.get_titles('rocky')

      expect(titles(rows)).to eq [['Rocky', '1976']]
      expect(from_apple?(rows.first)).to be true
    end

    it 'keeps Apple when TMDB answers first' do
      apple_and_tmdb_rocky
      delays[:apple] = 0.2

      expect(from_apple?(Movie.get_titles('rocky').sole)).to be true
    end
  end

  describe 'the same movie' do
    it 'ignores a non-breaking space after a stored director' do
      store_rocky(director: "John G. Avildsen ")
      apple_and_tmdb_rocky

      expect(Movie.get_titles('rocky').sole).to be_a Movie
    end

    it 'treats Apple and TMDB a year apart as one movie' do
      apple_and_tmdb_rocky(tmdb_year: 1977)

      expect(from_apple?(Movie.get_titles('rocky').sole)).to be true
    end

    it 'keeps same-titled movies from one year by different directors' do
      stub_tmdb_movie_search('rocky', [[481179, 'Rocky', 2008], [587443, 'Rocky', 2008]])
      stub_tmdb_movie(481179, title: 'Rocky', year: 2008, director: 'Martin Kellerman')
      stub_tmdb_movie(587443, title: 'Rocky', year: 2008, director: 'S. K. Nagendra Urs')

      expect(Movie.get_titles('rocky').map { |row| row[:director] }).to contain_exactly('Martin Kellerman', 'S. K. Nagendra Urs')
    end

    it 'lets a blank director match any director' do
      apple_and_tmdb_rocky(apple_director: nil)

      expect(from_apple?(Movie.get_titles('rocky').sole)).to be true
    end

    it "keeps one director's differently titled movies from the same year" do
      stub_tmdb_movie_search('rocky', [[1, 'Rocky', 1976], [2, 'Rocky Road', 1976]])
      stub_tmdb_movie(1, title: 'Rocky', year: 1976)
      stub_tmdb_movie(2, title: 'Rocky Road', year: 1976)

      expect(titles(Movie.get_titles('rocky'))).to contain_exactly(['Rocky', '1976'], ['Rocky Road', '1976'])
    end

    it 'keeps a remake from years later' do
      stub_tmdb_movie_search('rocky', [[877119, 'Rocky', 1948], [1366, 'Rocky', 1976]])
      stub_tmdb_movie(877119, title: 'Rocky', year: 1948, director: 'Phil Karlson')
      stub_tmdb_movie(1366, title: 'Rocky', year: 1976)

      expect(titles(Movie.get_titles('rocky'))).to eq [['Rocky', '1948'], ['Rocky', '1976']]
    end
  end

  describe 'Apple matches' do
    it 'keeps movies whose title contains the term, and nothing else' do
      stub_apple_movie_search('rocky', items: [['umc.rocky', 'Rocky'], ['umc.rocky2', 'Rocky II'], ['umc.creed', 'Creed'],
                                               { type: 'Show', id: 'umc.road', title: 'Rocky Road' }])
      stub_apple_movie('umc.rocky', title: 'Rocky', year: 1976)
      stub_apple_movie('umc.rocky2', title: 'Rocky II', year: 1979)

      expect(titles(Movie.get_titles('rocky'))).to eq [['Rocky', '1976'], ['Rocky II', '1979']]
    end

    it 'fetches at most 20 movies and keeps the exact match' do
      partials = (1..24).map { |n| ["umc.p#{n}", "Rocky Part #{n}"] }
      stub_apple_movie_search('rocky', items: partials + [['umc.rocky', 'Rocky']])
      partials.each_with_index { |(id, title), n| stub_apple_movie(id, title: title, year: 1980 + n) }
      stub_apple_movie('umc.rocky', title: 'Rocky', year: 1976)

      rows = Movie.get_titles('rocky')

      expect(search_requests(%r{/uts/v2/view/product/})).to eq 20
      expect(titles(rows)).to include ['Rocky', '1976']
    end

    it 'fetches a movie in every storefront once, from the US' do
      AppleTv::STORES.each { |store| stub_apple_movie_search('rocky', store: store, items: [['umc.rocky', 'Rocky']]) }
      stub_apple_movie('umc.rocky', title: 'Rocky', year: 1976)

      Movie.get_titles('rocky')

      expect(a_request(:get, %r{/view/product/umc\.rocky\?}).with(query: hash_including('sf' => '143441'))).to have_been_made.once
      expect(search_requests(%r{/view/product/})).to eq 1
    end

    it 'fetches a movie only outside the US from that storefront' do
      stub_apple_movie_search('rocky', store: '143444', items: [['umc.rocky', 'Rocky']])
      stub_apple_movie('umc.rocky', title: 'Rocky', year: 1976)

      Movie.get_titles('rocky')

      expect(a_request(:get, %r{/view/product/umc\.rocky\?}).with(query: hash_including('sf' => '143444'))).to have_been_made.once
    end

    it 'trims every kind of whitespace from credits' do
      stub_apple_movie_search('rocky', items: [['umc.rocky', 'Rocky']])
      stub_apple_movie('umc.rocky', title: 'Rocky', year: 1976, director: "John G. Avildsen ")

      expect(Movie.get_titles('rocky').sole[:director]).to eq 'John G. Avildsen'
    end
  end

  describe 'TMDB' do
    it 'makes one search request and one details request per movie' do
      movies = (1..20).map { |n| [n, "Rocky #{n}", 1970 + n] }
      stub_tmdb_movie_search('rocky', movies)
      movies.each { |id, title, year| stub_tmdb_movie(id, title: title, year: year, director: "Director #{id}") }

      expect(Movie.get_titles('rocky').size).to eq 20
      expect(search_requests(%r{api\.themoviedb\.org})).to eq 21
    end

    it 'leaves out results without a poster' do
      stub_tmdb_movie_search('rocky', [[1366, 'Rocky', 1976]], poster: false)

      expect(Movie.get_titles('rocky')).to eq []
    end

    it "keeps the database and Apple entries when TMDB's search doesn't answer in time" do
      Movie.create!(title: 'Rocky Balboa', year: '2006', director: 'Sylvester Stallone')
      stub_apple_movie_search('rocky', items: [['umc.rocky', 'Rocky']])
      stub_apple_movie('umc.rocky', title: 'Rocky', year: 1976)
      stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/movie\?}).to_timeout

      rows = nil
      expect { rows = Movie.get_titles('rocky') }.to output(/in_parallel: Net::OpenTimeout/).to_stdout
      expect(titles(rows)).to eq [['Rocky', '1976'], ['Rocky Balboa', '2006']]
    end

    it "leaves out a movie whose details don't answer in time" do
      stub_tmdb_movie_search('rocky', [[1366, 'Rocky', 1976], [1367, 'Rocky II', 1979]])
      stub_tmdb_movie(1366, title: 'Rocky', year: 1976)
      stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/movie/1367\?}).to_timeout

      rows = nil
      expect { rows = Movie.get_titles('rocky') }.to output(/in_parallel: Net::OpenTimeout/).to_stdout
      expect(titles(rows)).to eq [['Rocky', '1976']]
    end
  end

  describe 'scheduling' do
    it 'overlaps slow outside responses' do
      stub_apple_movie_search('rocky', items: [['umc.rocky', 'Rocky'], ['umc.rocky2', 'Rocky II']])
      stub_apple_movie('umc.rocky', title: 'Rocky', year: 1976)
      stub_apple_movie('umc.rocky2', title: 'Rocky II', year: 1979)
      movies = (1..5).map { |n| [n, "Rocky #{n}", 1980 + n] }
      stub_tmdb_movie_search('rocky', movies)
      movies.each { |id, title, year| stub_tmdb_movie(id, title: title, year: year, director: "Director #{id}") }
      delays[:apple] = delays[:tmdb] = 0.5

      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      rows = Movie.get_titles('rocky')

      expect(Process.clock_gettime(Process::CLOCK_MONOTONIC) - started).to be < 1.6
      expect(rows.size).to eq 7
    end

    it 'keeps the database and TMDB entries when Apple fails' do
      Movie.create!(title: 'Rocky Balboa', year: '2006', director: 'Sylvester Stallone')
      stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/}).to_return(status: 500, body: '')
      stub_tmdb_movie_search('rocky', [[1366, 'Rocky', 1976]])
      stub_tmdb_movie(1366, title: 'Rocky', year: 1976)

      expect(titles(Movie.get_titles('rocky'))).to eq [['Rocky', '1976'], ['Rocky Balboa', '2006']]
    end

    it 'keeps the database and Apple entries when TMDB answers with an error page' do
      Movie.create!(title: 'Rocky Balboa', year: '2006', director: 'Sylvester Stallone')
      stub_apple_movie_search('rocky', items: [['umc.rocky', 'Rocky']])
      stub_apple_movie('umc.rocky', title: 'Rocky', year: 1976)
      stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/}).to_return(status: 503, body: '<html>Service Unavailable</html>')

      expect(titles(Movie.get_titles('rocky'))).to eq [['Rocky', '1976'], ['Rocky Balboa', '2006']]
    end
  end
end

describe 'Movie.update_title_search' do
  include MovieSearchStubs

  before { stub_movie_sources_empty }

  it 'offers the outside sources only, with Apple over TMDB' do
    Movie.create!(title: 'Rocky', year: '1976', director: 'John G. Avildsen')
    stub_apple_movie_search('rocky', items: [['umc.rocky', 'Rocky']])
    stub_apple_movie('umc.rocky', title: 'Rocky', year: 1976)
    stub_tmdb_movie_search('rocky', [[1366, 'Rocky', 1976]])
    stub_tmdb_movie(1366, title: 'Rocky', year: 1976)

    row = Movie.update_title_search('rocky').sole

    expect(row).not_to be_a Movie
    expect(row[:poster]).to include 'mzstatic'
  end

  it 'returns an empty list when nothing is found' do
    expect(Movie.update_title_search('rocky')).to eq []
  end
end

describe 'Movie.plex_add' do
  include MovieSearchStubs

  before { stub_movie_sources_empty }

  it 'imports only the exact title and year when Apple also returns partial matches' do
    user = create_user
    stub_apple_movie_search('rocky', items: [['umc.rocky', 'Rocky'], ['umc.rocky2', 'Rocky II']])
    stub_apple_movie('umc.rocky', title: 'Rocky', year: 1976)
    stub_apple_movie('umc.rocky2', title: 'Rocky II', year: 1979)

    Movie.plex_add({ 'title' => 'Rocky', 'year' => 1976 }, user.id)

    expect(Movie.pluck(:title, :year)).to eq [['Rocky', '1976']]
    expect(user.movies.reload.map(&:title)).to eq ['Rocky']
  end
end
