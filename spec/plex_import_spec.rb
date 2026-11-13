describe 'Plex imports' do
  include ShowSearchStubs

  let(:user) { create_user }
  let(:today) { Date.today }

  def episodes_url = %r{\Ahttps://tv\.apple\.com/api/uts/v2/view/show/lupin/episodes\?}

  # Local midnight, so the formatted date is the same day whatever the server's time zone.
  def apple_episode(number, released) = { title: "Chapter #{number}", description: "Chapter #{number} of Lupin", episodeNumber: number, duration: 2700,
                                          releaseDate: released && released.to_time.to_i * 1000, images: { previewFrame: { url: "https://is1-ssl.mzstatic.com/ep#{number}/{w}x{h}.{f}" } } }

  def stub_apple(released, skip: 0) = stub_window(skip, released.map.with_index(skip + 1) { |date, number| apple_episode(number, date) })

  def stub_window(skip, episodes)
    stub_request(:get, episodes_url).to_return(json(apple_episodes('lupin', [[1, 5]])))
    stub_request(:get, episodes_url).with(query: hash_including('skip' => skip.to_s, 'count' => episodes.size.to_s))
      .to_return(json(data: { episodes: episodes }))
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

  it 'adds a reported episode whose title the source spells differently' do
    season = store_lupin
    stub_window(1, [apple_episode(2, today).merge(title: 'Chapter 2, Part 1')])

    Show.plex_add(episode_event.merge('title' => 'Chapter 2 (1)'), user.id)

    expect(season.episodes.pluck(:tv_episode, :title)).to eq [[2, 'Chapter 2, Part 1']]
  end

  it 'adds nothing when the source answers with another episode' do
    season = store_lupin
    stub_window(1, [apple_episode(3, today)])

    Show.plex_add(episode_event, user.id)

    expect(season.episodes).to be_empty
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

  describe 'an episode whose title several shows share' do
    def lowdown_episode(season: 1, guid: nil) = { 'type' => 'episode', 'grandparentTitle' => 'The Lowdown', 'parentIndex' => season, 'index' => 2, 'title' => 'Episode 2', 'year' => 2025, 'Guid' => guid }.compact

    def stub_lowdowns(apple_seasons: [[1, 8]], tmdb_seasons: [1])
      stub_apple_search('the lowdown', shows: [['lowdown25', 'The Lowdown']])
      stub_apple_show('lowdown25', title: 'The Lowdown', seasons: apple_seasons, year: 2025)
      stub_tmdb_search('the lowdown', [[32977, 'The Lowdown', 1988]])
      stub_tmdb_show(32977, name: 'The Lowdown', seasons: tmdb_seasons)
    end

    it 'adds nothing and logs when two unstored shows match' do
      stub_lowdowns

      expect { Show.plex_add(lowdown_episode, user.id) }.to output("Plex episode skipped, several shows match: The Lowdown S1E2\n").to_stdout

      expect([Show.count, Season.count, Episode.count]).to eq [0, 0, 0]
    end

    # Apple lists every season's episodes in one run, so season 2's episode 2 is the tenth after eight in season 1.
    def stub_lowdown_episode(seasons, season: 2, skip: 9)
      url = %r{\Ahttps://tv\.apple\.com/api/uts/v2/view/show/lowdown25/episodes\?}
      stub_request(:get, url).to_return(json(apple_episodes('lowdown25', seasons)))
      stub_request(:get, url).with(query: hash_including('skip' => skip.to_s, 'count' => '1'))
        .to_return(json(data: { episodes: [apple_episode(2, today).merge(title: 'Episode 2', seasonNumber: season)] }))
    end

    def store_lowdown
      Show.create!(title: 'The Lowdown', year: '2025', show_collection_id: 'lowdown25')
          .seasons.create!(season: 1, collectionName: 'The Lowdown, Season 1', collectionId: 'lowdown25-s1', appleTvId: 'lowdown25', skip: '0', count: '8', storeId: '143441')
          .show
    end

    it 'adds a new season to the stored show, not to an unstored namesake' do
      show = store_lowdown
      stub_lowdowns(apple_seasons: [[1, 8], [2, 8]], tmdb_seasons: [2])
      stub_lowdown_episode([[1, 8], [2, 8]])

      Show.plex_add(lowdown_episode(season: 2), user.id)

      expect(Show.pluck(:show_collection_id)).to eq ['lowdown25']
      expect(show.seasons.find_by(season: 2).episodes.pluck(:tv_episode)).to eq [2]
    end

    it 'creates the only matching show when none is stored' do
      stub_apple_search('the lowdown', shows: [['lowdown25', 'The Lowdown']])
      stub_apple_show('lowdown25', title: 'The Lowdown', seasons: [[1, 8]], year: 2025)
      stub_lowdown_episode([[1, 8]], season: 1, skip: 1)

      Show.plex_add(lowdown_episode, user.id)

      expect(Show.pluck(:show_collection_id, :year)).to eq [['lowdown25', '2025']]
      expect(Episode.pluck(:tv_episode)).to eq [2]
    end

    context 'with the episode IDs Plex sends' do
      let(:guid) { [{ 'id' => 'imdb://tt35000002' }, { 'id' => 'tmdb://5000002' }, { 'id' => 'tvdb://9000002' }] }

      def stub_find(id, source, show_id)
        stub_request(:get, "https://api.themoviedb.org/3/find/#{id}?external_source=#{source}").to_return(json(tv_episode_results: show_id ? [{ show_id: show_id }] : []))
      end

      def stub_first_aired(show_id, date) = stub_request(:get, "https://api.themoviedb.org/3/tv/#{show_id}").to_return(json(id: show_id, first_air_date: date))

      before { stub_first_aired(273247, '2025-09-23') }

      it 'adds the episode to the stored show TMDB places it in' do
        show = store_lowdown
        stub_lowdowns
        stub_find('tt35000002', 'imdb_id', 273247)
        stub_lowdown_episode([[1, 8]], season: 1, skip: 1)

        Show.plex_add(lowdown_episode(guid: guid), user.id)

        expect(Show.pluck(:show_collection_id)).to eq ['lowdown25']
        expect(show.seasons.first.episodes.pluck(:tv_episode)).to eq [2]
      end

      it 'tells apart two stored namesakes' do
        uk = Show.create!(title: 'The Office', year: '2001', show_collection_id: 'office01')
        uk.seasons.create!(season: 2, collectionName: 'The Office, Season 2', collectionId: 'office01-s2', appleTvId: 'office01', skip: '6', count: '6', storeId: '143441')
        us = Show.create!(title: 'The Office', year: '2005', show_collection_id: '2316')
        us_season = us.seasons.create!(season: 2, collectionName: 'The Office, Season 2', collectionId: 'tmdb23162', count: '22')
        stub_request(:get, %r{\Ahttps://tv\.apple\.com/api/uts/v2/view/show/office01/episodes\?}).to_return(json(apple_episodes('office01', [[1, 6], [2, 6]])))
        stub_find('tt0664514', 'imdb_id', 2316)
        stub_first_aired(2316, '2005-03-24')
        stub_request(:get, 'https://api.themoviedb.org/3/tv/2316/season/2/episode/3').to_return(json(episode_number: 3, name: 'Office Olympics', air_date: '2005-10-04', overview: 'Michael buys a condo', runtime: 22))
        event = { 'type' => 'episode', 'grandparentTitle' => 'The Office', 'parentIndex' => 2, 'index' => 3, 'title' => 'Office Olympics', 'year' => 2005, 'Guid' => [{ 'id' => 'imdb://tt0664514' }] }

        Show.plex_add(event, user.id)

        expect(Episode.pluck(:season_id, :tv_episode, :title)).to eq [[us_season.id, 3, 'Office Olympics']]
      end

      it 'asks TMDB by the TVDB ID when the IMDb ID finds no episode' do
        stub_lowdowns
        stub_find('tt35000002', 'imdb_id', nil)
        stub_find('9000002', 'tvdb_id', 273247)
        stub_lowdown_episode([[1, 8]], season: 1, skip: 1)

        Show.plex_add(lowdown_episode(guid: guid), user.id)

        expect(Show.pluck(:show_collection_id)).to eq ['lowdown25']
      end

      it 'falls back to the stored show when TMDB times out, and the webhook still answers 204' do
        show = store_lowdown
        stub_lowdowns
        stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/find/}).to_timeout
        stub_lowdown_episode([[1, 8]], season: 1, skip: 1)
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('PLEX_USER_ID').and_return(user.id.to_s)
        event = { 'event' => 'library.new', 'Account' => { 'title' => ENV['PLEX_USER'] }, 'Metadata' => lowdown_episode(guid: guid).merge('librarySectionType' => 'show') }

        response = nil
        expect { response = post("/v1/webhooks/new?token=#{ENV['PLEX_WEBHOOK_SECRET']}", json: event, xhr: false, once: true) }
          .to output(/TMDB couldn't place the Plex episode: execution expired/).to_stdout

        expect(response.status).to eq 204
        expect(Show.pluck(:show_collection_id)).to eq ['lowdown25']
        expect(show.seasons.first.episodes.pluck(:tv_episode)).to eq [2]
      end

      it "falls back to the stored show when TMDB places the episode but won't give the show's year" do
        show = store_lowdown
        stub_lowdowns
        stub_find('tt35000002', 'imdb_id', 273247)
        stub_request(:get, 'https://api.themoviedb.org/3/tv/273247').to_return(status: 429, body: { status_code: 25, status_message: 'Too many requests' }.to_json, headers: { 'Content-Type' => 'application/json' })
        stub_lowdown_episode([[1, 8]], season: 1, skip: 1)

        Show.plex_add(lowdown_episode(guid: guid), user.id)

        expect(Show.pluck(:show_collection_id)).to eq ['lowdown25']
        expect(show.seasons.first.episodes.pluck(:tv_episode)).to eq [2]
      end

      it 'creates the show from Apple when Apple and TMDB both list it' do
        stub_lowdowns
        stub_tmdb_search('the lowdown', [[273247, 'The Lowdown', 2025], [32977, 'The Lowdown', 1988]])
        stub_tmdb_show(273247, name: 'The Lowdown', seasons: [1])
        stub_find('tt35000002', 'imdb_id', 273247)
        stub_lowdown_episode([[1, 8]], season: 1, skip: 1)

        Show.plex_add(lowdown_episode(guid: guid), user.id)

        expect(Show.pluck(:show_collection_id)).to eq ['lowdown25']
        expect(Season.pluck(:collectionId)).to eq ['lowdown25-s1']
        expect(Episode.pluck(:tv_episode)).to eq [2]
      end
    end
  end

  describe 'a show whose title a namesake shares' do
    before do
      stub_apple_search('matlock', shows: [['matlock24', 'Matlock'], ['matlock86', 'Matlock']])
      { 'matlock24' => 2024, 'matlock86' => 1986 }.each do |id, year|
        stub_apple_show(id, title: 'Matlock', seasons: [[1, 2]], year: year)
        url = %r{\Ahttps://tv\.apple\.com/api/uts/v2/view/show/#{id}/episodes\?}
        stub_request(:get, url).to_return(json(apple_episodes(id, [[1, 2]])))
        stub_request(:get, url).with(query: hash_including('skip' => '0', 'count' => '2'))
          .to_return(json(data: { episodes: [1, 2].map { |number| apple_episode(number, today - 1).merge(seasonNumber: 1) } }))
      end
    end

    { 2025 => 'matlock24', 1986 => 'matlock86' }.each do |plex_year, id|
      it "imports from the show within a year of Plex's #{plex_year}" do
        Show.plex_add({ 'type' => 'show', 'title' => 'Matlock', 'childCount' => 1, 'year' => plex_year }, user.id)

        expect(Show.pluck(:show_collection_id)).to eq [id]
        expect(Episode.count).to eq 2
      end
    end
  end

  it 'keeps a formatted runtime when an episode is saved again' do
    episode = store_lupin.episodes.create!(title: 'Chapter 1', tv_episode: 1, runtime: '65')
    episode.update!(runtime: '1h 10m')

    expect(episode.reload.runtime).to eq '1h 10m'
  end
end
