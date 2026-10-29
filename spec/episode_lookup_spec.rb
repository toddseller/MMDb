describe 'Apple episode lookups' do
  include ShowSearchStubs

  def episodes_url = %r{\Ahttps://tv\.apple\.com/api/uts/v2/view/show/lupin/episodes\?}

  def apple_episode(number, season: nil) = { title: "Chapter #{number}", description: "Chapter #{number} of Lupin", episodeNumber: number, seasonNumber: season, duration: 2700,
                                              releaseDate: Time.utc(2021, 1, 8).to_i * 1000, images: { previewFrame: { url: "https://is1-ssl.mzstatic.com/ep#{number}/{w}x{h}.{f}" } } }.compact

  def stub_episodes(store, skip:, count:)
    stub_request(:get, episodes_url).with(query: hash_including('sf' => store, 'skip' => skip.to_s, 'count' => count.to_s))
      .to_return(json(data: { episodes: (skip + 1..skip + count).map { |number| apple_episode(number) } }))
  end

  # Apple's season summaries, which the season windows are worked out from.
  def stub_seasons(seasons, status: 200) = stub_request(:get, episodes_url).to_return(json(apple_episodes('lupin', seasons)).merge(status: status))

  before { stub_seasons([[1, 5]]) }

  def store_lupin(store)
    Show.create!(title: 'Lupin', year: '2021', show_collection_id: 'lupin')
        .seasons.create!(season: 1, collectionName: 'Lupin, Season 1', collectionId: 'lupin-s1', appleTvId: 'lupin', skip: '0', count: '5', storeId: store)
  end

  # Called the way the add-episodes endpoints call it.
  def episodes_for(season) = Show.get_episodes(season.appleTvId, season.season, season.skip, season.count, season.storeId)

  it 'fetches a season with no stored storefront from the US store' do
    stub_episodes('143441', skip: 0, count: 5)

    expect(episodes_for(store_lupin(nil)).map { |episode| episode[:tv_episode] }).to eq [1, 2, 3, 4, 5]
  end

  it 'keeps a stored storefront' do
    stub_episodes('143444', skip: 0, count: 5)

    expect(episodes_for(store_lupin('143444')).size).to eq 5
  end

  it 'imports a Plex episode of a season with no stored storefront' do
    user = create_user
    season = store_lupin(nil)
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?}).to_return(json(data: { canvas: { shelves: [] } }))
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/tv\?}).to_return(json(results: []))
    stub_request(:get, episodes_url).to_return(json(apple_episodes('lupin', [[1, 5]])))
    stub_episodes('143441', skip: 1, count: 1)

    Show.plex_add({ 'type' => 'episode', 'grandparentTitle' => 'Lupin', 'parentIndex' => 1, 'index' => 2, 'title' => 'Chapter 2', 'year' => 2021 }, user.id)

    expect(season.episodes.pluck(:tv_episode, :title)).to eq [[2, 'Chapter 2']]
  end

  it 'lists no episodes for a season stored with a TVDB id, without asking TVDB' do
    season = Show.create!(title: 'NOVA', year: '1974', show_collection_id: '761193')
                 .seasons.create!(season: 32, collectionName: 'NOVA, Season 32', collectionId: 'tvdb7611932')

    expect(Show.get_episodes(season.collectionId, season.season)).to eq []
    expect(a_request(:any, /thetvdb/)).not_to have_been_made
  end

  describe 'when Apple has added an episode to an earlier season' do
    # Season 2 was stored when season 1 had 5 episodes; Apple now lists 6, so season 2 starts at 6, not 5.
    let(:season2) do
      Show.create!(title: 'Lupin', year: '2021', show_collection_id: 'lupin')
          .seasons.create!(season: 2, collectionName: 'Lupin, Season 2', collectionId: 'lupin-s2', appleTvId: 'lupin', skip: '5', count: '3', storeId: '143441')
    end

    def stub_window(skip, count, episodes)
      stub_request(:get, episodes_url).with(query: hash_including('skip' => skip.to_s, 'count' => count.to_s))
        .to_return(json(data: { episodes: episodes.map { |season, number| apple_episode(number, season: season) } }))
    end

    it "lists the season from Apple's current layout" do
      stub_seasons([[1, 6], [2, 3]])
      stub_window(6, 3, [[2, 1], [2, 2], [2, 3]])

      expect(episodes_for(season2).map { |episode| episode[:tv_episode] }).to eq [1, 2, 3]
    end

    it "lists no episode of another season, even inside the season's window" do
      stub_seasons([[1, 6], [2, 3]])
      stub_window(6, 3, [[1, 6], [2, 1], [2, 2]])

      expect(episodes_for(season2).map { |episode| episode[:title] }).to eq ['Chapter 1', 'Chapter 2']
    end

    it 'imports the episode Plex reports from its current place' do
      user = create_user
      season = season2
      stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?}).to_return(json(data: { canvas: { shelves: [] } }))
      stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/tv\?}).to_return(json(results: []))
      stub_seasons([[1, 6], [2, 3]])
      stub_window(7, 1, [[2, 2]])

      Show.plex_add({ 'type' => 'episode', 'grandparentTitle' => 'Lupin', 'parentIndex' => 2, 'index' => 2, 'title' => 'Chapter 2', 'year' => 2021 }, user.id)

      expect(season.episodes.pluck(:tv_episode, :title)).to eq [[2, 'Chapter 2']]
    end

    it 'logs a failed season list and still lists the stored window' do
      stub_request(:get, episodes_url).to_raise(SocketError.new('getaddrinfo failed'))
      stub_window(5, 3, [[2, 1], [2, 2], [2, 3]])

      episodes = nil
      expect { episodes = episodes_for(season2) }.to output("Apple season list failed for lupin: getaddrinfo failed\n").to_stdout
      expect(episodes.size).to eq 3
    end

    it 'falls back to the stored window when the season list is unavailable' do
      stub_seasons([], status: 500)
      stub_window(5, 3, [[2, 1], [2, 2], [2, 3]])

      expect(episodes_for(season2).size).to eq 3
    end
  end

  # Apple's seasons don't always start at 1, so a season is found by its number, not its position.
  it "refreshes a stored season's count by its season number" do
    season = Show.create!(title: 'Lupin', year: '2021', show_collection_id: 'lupin')
                 .seasons.create!(season: 2, collectionName: 'Lupin, Season 2', collectionId: 'lupin-s2', appleTvId: 'lupin', skip: '0', count: '3', storeId: '143441')
    stub_seasons([[2, 4]])

    expect(Show.refresh_apple_count(season.attributes.symbolize_keys)[:count]).to eq '4'
  end
end
