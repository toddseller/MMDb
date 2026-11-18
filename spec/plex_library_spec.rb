module TautulliStubs
  include ShowSearchStubs

  def tautulli_url = %r{\Ahttps://plex\.toddseller\.dev/api/v2\?}

  def stub_tautulli(cmd, data, **params)
    stub_request(:get, tautulli_url).with(query: hash_including('cmd' => cmd, **params.transform_values(&:to_s)))
                                    .to_return(json(response: { result: 'success', data: data }))
  end

  def stub_library(section, items)
    stub_tautulli('get_library_media_info', { data: items.map { |key, title, year| { rating_key: key.to_s, title: title, year: year.to_s } } }, section_id: section)
  end
end

describe 'PlexLibrary.link' do
  include TautulliStubs

  let(:user) { create_user }

  def movie(title, year, key: nil) = create_movie(user, title: title).tap { |m| m.update_columns(year: year.to_s, plex_key: key) }

  def show(title, year)
    Show.create!(title: title, year: year.to_s).tap { |s| user.shows << s }
  end

  def link(movies: [], shows: [])
    stub_library(1, movies)
    stub_library(2, shows)
    PlexLibrary.link(user)
  end

  it 'links a movie whose name and year agree' do
    carter = movie('Get Carter', 1971)

    link(movies: [[134221, 'Get Carter', 1971]])

    expect(carter.reload.plex_key).to eq 134221
  end

  it 'links a show dated a year apart' do
    matlock = show('Matlock', 2024)

    link(shows: [[9001, 'Matlock', 2025]])

    expect(matlock.reload.plex_key).to eq 9001
  end

  it 'leaves an already linked movie alone' do
    carter = movie('Get Carter', 1971, key: 5)

    link(movies: [[134221, 'Get Carter', 1971]])

    expect(carter.reload.plex_key).to eq 5
  end

  it "links a lone same-name movie whatever its year, and reports it" do
    madden = movie('Madden', 2023)

    expect { link(movies: [[134511, 'Madden', 2026]]) }.to output(/Madden \(2026\).*Madden \(2023\)/).to_stdout

    expect(madden.reload.plex_key).to eq 134511
    expect([madden.title, madden.year, user.movies.reload]).to eq ['Madden', '2023', [madden]]
  end

  it 'links neither of two namesakes to a Plex movie of another year' do
    old, new = movie('Halloween', 1978), movie('Halloween', 2018)

    link(movies: [[1, 'Halloween', 2007]])

    expect([old.reload.plex_key, new.reload.plex_key]).to eq [nil, nil]
  end

  it 'links nothing when two Plex movies fit one entry' do
    rocky = movie('Rocky', 1976)

    link(movies: [[1, 'Rocky', 1976], [2, 'Rocky', 1977]])

    expect(rocky.reload.plex_key).to be_nil
  end

  it 'reports a Plex item it could not link' do
    expect { link(movies: [[7, 'The X Files', 1998]]) }.to output(/The X Files \(1998\)/).to_stdout
  end

  it 'changes nothing when Tautulli times out' do
    carter = movie('Get Carter', 1971)
    stub_library(1, [[134221, 'Get Carter', 1971]])
    stub_request(:get, tautulli_url).with(query: hash_including('section_id' => '2')).to_timeout

    expect { PlexLibrary.link(user) }.to raise_error(StandardError)

    expect(carter.reload.plex_key).to be_nil
  end
end

describe 'PlexLibrary.sync, movies' do
  include TautulliStubs
  include MovieSearchStubs

  let(:user) { create_user }

  before do
    stub_movie_sources_empty
    stub_tautulli('get_recently_added', { recently_added: [] }, section_id: 2)
  end

  def movie(title, year, key: nil) = create_movie(user, title: title).tap { |m| m.update_columns(year: year.to_s, plex_key: key) }

  def stub_recent_movies(*items)
    added = items.map { |key, title, year, age| { rating_key: key.to_s, title: title, year: year.to_s, media_type: 'movie', added_at: (Time.now - age).to_i.to_s } }
    stub_tautulli('get_recently_added', { recently_added: added }, section_id: 1)
  end

  def stub_found(term, id, title, year)
    stub_tmdb_movie_search(term, [[id, title, year]])
    stub_tmdb_movie(id, title: title, year: year)
  end

  def collection = user.movies.reload.map { |m| [m.title, m.year, m.plex_key] }

  it 'replaces a movie whose Plex match was fixed, deleting the old row and its rating' do
    old = movie('Madden', 2023, key: 134511)
    rating = old.ratings.create!(user: user, stars: 3)
    stub_recent_movies([134511, 'Madden', 2026, 1.hour])
    stub_found('madden', 1131943, 'Madden', 2026)

    expect { PlexLibrary.sync(user) }.to output("Added movie: Madden (2026)\nDeleted movie: Madden (2023)\n").to_stdout

    expect(collection).to eq [['Madden', '2026', 134511]]
    expect([Movie.exists?(old.id), Rating.exists?(rating.id)]).to eq [false, false]
  end

  it "keeps the replaced movie's row when another user has it" do
    old = movie('Madden', 2023, key: 134511)
    other = create_user.tap { |u| u.movies << old }
    stub_recent_movies([134511, 'Madden', 2026, 1.hour])
    stub_found('madden', 1131943, 'Madden', 2026)

    expect { PlexLibrary.sync(user) }.to output("Added movie: Madden (2026)\nRemoved movie: Madden (2023)\n").to_stdout

    expect(collection).to eq [['Madden', '2026', 134511]]
    expect(old.reload.plex_key).to be_nil
    expect(other.movies.reload).to eq [old]
  end

  it 'replaces a movie whose fix changed the title' do
    movie('The Thing Called Love', 1993, key: 42)
    stub_recent_movies([42, 'The Thing', 1982, 1.day])
    stub_found('the thing', 1091, 'The Thing', 1982)

    PlexLibrary.sync(user)

    expect(collection).to eq [['The Thing', '1982', 42]]
  end

  it 'changes nothing when Plex agrees' do
    movie('Get Carter', 1971, key: 134221)
    stub_recent_movies([134221, 'Get Carter', 1971, 2.days])

    expect { PlexLibrary.sync(user) }.not_to output.to_stdout

    expect(collection).to eq [['Get Carter', '1971', 134221]]
  end

  it 'ignores an addition older than a week' do
    movie('Madden', 2023, key: 134511)
    stub_recent_movies([134511, 'Madden', 2026, 8.days])

    PlexLibrary.sync(user)

    expect(collection).to eq [['Madden', '2023', 134511]]
  end

  it 'leaves a movie added in the last few minutes to the webhook' do
    stub_recent_movies([134494, 'Plan 9 from Outer Space', 1957, 2.minutes])
    stub_found('plan 9 from outer space', 10513, 'Plan 9 from Outer Space', 1957)

    expect { PlexLibrary.sync(user) }.not_to output.to_stdout

    expect(collection).to eq []
  end

  it 'keeps the old movie when the search finds nothing' do
    movie('Madden', 2023, key: 134511)
    stub_recent_movies([134511, 'Madden', 2026, 1.hour])

    expect { PlexLibrary.sync(user) }.not_to output.to_stdout

    expect(collection).to eq [['Madden', '2023', 134511]]
  end

  it 'imports a recent Plex movie the webhook missed' do
    stub_recent_movies([134494, 'Plan 9 from Outer Space', 1957, 3.days])
    stub_found('plan 9 from outer space', 10513, 'Plan 9 from Outer Space', 1957)

    expect { PlexLibrary.sync(user) }.to output("Added movie: Plan 9 from Outer Space (1957)\n").to_stdout

    expect(collection).to eq [['Plan 9 from Outer Space', '1957', 134494]]
  end

  it 'links an unlinked movie already in the collection without reporting it' do
    movie('Get Carter', 1971)
    stub_recent_movies([134221, 'Get Carter', 1971, 2.days])

    expect { PlexLibrary.sync(user) }.not_to output.to_stdout

    expect(collection).to eq [['Get Carter', '1971', 134221]]
  end

  it 'changes nothing when Tautulli times out' do
    movie('Madden', 2023, key: 134511)
    stub_recent_movies([134511, 'Madden', 2026, 1.hour])
    stub_found('madden', 1131943, 'Madden', 2026)
    stub_request(:get, tautulli_url).with(query: hash_including('section_id' => '2')).to_timeout

    expect { PlexLibrary.sync(user) }.to raise_error(Net::OpenTimeout)

    expect(collection).to eq [['Madden', '2023', 134511]]
  end
end

describe 'PlexLibrary.sync, episodes' do
  include TautulliStubs

  let(:user) { create_user }

  before do
    stub_tautulli('get_recently_added', { recently_added: [] }, section_id: 1)
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?}).to_return(json(data: { canvas: { shelves: [] } }))
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/tv\?}).to_return(json(results: []))
    stub_tautulli('get_metadata', { guids: [] })
  end

  def stub_recent_episodes(*items)
    added = items.map do |show_key, show, season, number, age|
      { rating_key: "#{show_key}#{season}#{number}", grandparent_rating_key: show_key.to_s, grandparent_title: show, parent_media_index: season.to_s,
        media_index: number.to_s, title: "Episode #{number}", year: '2026', media_type: 'episode', added_at: (Time.now - age).to_i.to_s }
    end
    stub_tautulli('get_recently_added', { recently_added: added }, section_id: 2)
  end

  def stub_tmdb_episode(id, season, number)
    stub_request(:get, "https://api.themoviedb.org/3/tv/#{id}/season/#{season}/episode/#{number}")
      .to_return(json(episode_number: number, name: "Chapter #{number}", air_date: '2026-11-17', overview: 'An episode', runtime: 50))
  end

  def best_medicine(key: 7002, episodes: [7])
    show = Show.create!(title: 'Best Medicine', year: '2026', show_collection_id: '777', plex_key: key)
    season = show.seasons.create!(season: 2, collectionName: 'Best Medicine, Season 2', collectionId: 'tmdb7772', count: '8')
    episodes.each { |number| season.episodes.create!(tv_episode: number, title: "Chapter #{number}") }
    user.shows << show
    season
  end

  it 'imports an episode whose show the search found only later' do
    stub_recent_episodes([7001, 'The Good Daughter', 1, 1, 2.hours])
    stub_tmdb_search('the good daughter', [[555, 'The Good Daughter', 2026]])
    stub_tmdb_show(555, name: 'The Good Daughter', seasons: [1])
    stub_tmdb_episode(555, 1, 1)

    expect { PlexLibrary.sync(user) }.to output("Added episode: The Good Daughter S1E1\n").to_stdout

    show = user.shows.find_by(plex_key: 7001)
    expect(show.seasons.find_by(season: 1).episodes.pluck(:tv_episode)).to eq [1]
  end

  it 'imports an episode the source now lists' do
    season = best_medicine
    stub_recent_episodes([7002, 'Best Medicine', 2, 8, 6.hours])
    stub_tmdb_episode(777, 2, 8)

    expect { PlexLibrary.sync(user) }.to output("Added episode: Best Medicine S2E8\n").to_stdout

    expect(season.episodes.pluck(:tv_episode)).to contain_exactly(7, 8)
  end

  it 'leaves a present episode alone' do
    best_medicine(episodes: [7, 8])
    stub_recent_episodes([7002, 'Best Medicine', 2, 8, 6.hours])

    expect { PlexLibrary.sync(user) }.not_to output.to_stdout

    expect(a_request(:get, tautulli_url).with(query: hash_including('cmd' => 'get_metadata'))).not_to have_been_made
  end

  it 'finds a present episode in an unlinked show by name' do
    best_medicine(key: nil, episodes: [7, 8])
    stub_recent_episodes([7002, 'Best Medicine', 2, 8, 6.hours])

    expect { PlexLibrary.sync(user) }.not_to output.to_stdout

    expect(a_request(:get, tautulli_url).with(query: hash_including('cmd' => 'get_metadata'))).not_to have_been_made
  end

  it 'ignores an episode added more than a week ago' do
    best_medicine
    stub_recent_episodes([7002, 'Best Medicine', 2, 8, 8.days])

    expect { PlexLibrary.sync(user) }.not_to output.to_stdout
  end

  it 'reports an episode the source still lacks' do
    season = best_medicine
    stub_recent_episodes([7002, 'Best Medicine', 2, 8, 6.hours])
    stub_request(:get, 'https://api.themoviedb.org/3/tv/777/season/2/episode/8').to_return(status: 404, body: '{}')

    expect { PlexLibrary.sync(user) }.to output("Still missing: Best Medicine S2E8\n").to_stdout

    expect(season.episodes.pluck(:tv_episode)).to eq [7]
  end
end
