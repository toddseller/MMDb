describe 'Plex imports' do
  include ShowSearchStubs

  let(:user) { create_user }
  let(:today) { Date.today }

  def episodes_url = %r{\Ahttps://tv\.apple\.com/api/uts/v2/view/show/lupin/episodes\?}

  # Local midnight, so the formatted date is the same day whatever the server's time zone.
  def apple_episode(number, released) = { title: "Chapter #{number}", description: "Chapter #{number} of Lupin", episodeNumber: number, duration: 2700,
                                          releaseDate: released && released.to_time.to_i * 1000, images: { previewFrame: { url: "https://is1-ssl.mzstatic.com/ep#{number}/{w}x{h}.{f}" } } }

  def stub_apple(released, skip: 0)
    stub_request(:get, episodes_url).to_return(json(apple_episodes('lupin', [[1, 5]])))
    stub_request(:get, episodes_url).with(query: hash_including('skip' => skip.to_s, 'count' => released.size.to_s))
      .to_return(json(data: { episodes: released.map.with_index(skip + 1) { |date, number| apple_episode(number, date) } }))
  end

  def stub_searches
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?}).to_return(json(data: { canvas: { shelves: [] } }))
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/tv\?}).to_return(json(results: []))
  end

  def store_lupin
    Show.create!(title: 'Lupin', year: '2021', show_collection_id: 'lupin')
        .seasons.create!(season: 1, collectionName: 'Lupin, Season 1', collectionId: 'lupin-s1', appleTvId: 'lupin', skip: '0', count: '5', storeId: '143441')
  end

  def show_event = { 'type' => 'show', 'title' => 'Lupin', 'childCount' => 1, 'year' => 2021 }
  def episode_event = { 'type' => 'episode', 'grandparentTitle' => 'Lupin', 'parentIndex' => 1, 'index' => 2, 'title' => 'Chapter 2', 'year' => 2021 }

  before { stub_searches }

  it 'adds only the aired episodes of a show-level Apple season' do
    season = store_lupin
    stub_apple([today - 7, today - 1, today, today + 7, nil])

    Show.plex_add(show_event, user.id)

    expect(season.episodes.pluck(:tv_episode)).to contain_exactly(1, 2, 3)
  end

  it 'adds only the aired episodes of a show-level TMDB season' do
    season = Show.create!(title: 'Lupin', year: '2021', show_collection_id: '96677')
                 .seasons.create!(season: 1, collectionName: 'Lupin, Season 1', collectionId: 'tmdb966771', count: '2')
    stub_request(:get, 'https://api.themoviedb.org/3/tv/96677/season/1').to_return(json(episodes: [
      { episode_number: 1, name: 'Chapter 1', air_date: (today - 1).iso8601, overview: 'Aired', runtime: 45 },
      { episode_number: 2, name: 'Chapter 2', air_date: (today + 7).iso8601, overview: 'Upcoming', runtime: 45 }
    ]))

    Show.plex_add(show_event, user.id)

    expect(season.episodes.pluck(:tv_episode)).to eq [1]
  end

  it 'adds a single reported episode whatever its date' do
    season = store_lupin
    stub_apple([today + 1], skip: 1)

    Show.plex_add(episode_event, user.id)

    expect(season.episodes.pluck(:tv_episode)).to eq [2]
  end

  it 'refreshes a stored placeholder from a single reported episode' do
    season = store_lupin
    season.episodes.create!(title: 'Episode 2', tv_episode: 2)
    stub_apple([today - 1], skip: 1)

    Show.plex_add(episode_event, user.id)

    expect(season.episodes.pluck(:tv_episode, :title, :plot, :runtime)).to eq [[2, 'Chapter 2', 'Chapter 2 of Lupin', '45 min']]
  end

  it 'refreshes a stored placeholder from a show-level import' do
    season = store_lupin
    season.episodes.create!(title: 'Episode 2', tv_episode: 2)
    stub_apple([today - 1] * 5)

    Show.plex_add(show_event, user.id)

    expect(season.episodes.find_by(tv_episode: 2)).to have_attributes(title: 'Chapter 2', plot: 'Chapter 2 of Lupin')
  end

  it 'overwrites a title edited by hand' do
    season = store_lupin
    season.episodes.create!(title: 'My own title', tv_episode: 2, plot: 'Chapter 2 of Lupin')
    stub_apple([today - 1], skip: 1)

    Show.plex_add(episode_event, user.id)

    expect(season.episodes.find_by(tv_episode: 2).title).to eq 'Chapter 2'
  end

  it 'keeps a formatted runtime when an episode is saved again' do
    episode = store_lupin.episodes.create!(title: 'Chapter 1', tv_episode: 1, runtime: '65')
    episode.update!(runtime: '1h 10m')

    expect(episode.reload.runtime).to eq '1h 10m'
  end
end
