describe 'Show.get_series' do
  include ShowSearchStubs

  before do
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?}).to_return(json(data: { canvas: { shelves: [] } }))
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/tv\?}).to_return(json(results: []))
  end

  def names(rows) = rows.map { |row| row[:collectionName] }

  context 'today’s results' do
    before do
      stub_apple_search('lupin', shows: [['umc.cmc.lupin', 'Lupin']])
      stub_apple_show('umc.cmc.lupin', title: 'Lupin', seasons: [[1, 5], [2, 5]])
      stub_tmdb_search('lupin', [[96677, 'Lupin']])
      stub_tmdb_show(96677, name: 'Lupin', seasons: [1, 2, 3])
    end

    it 'gives one entry per season, Apple first and TMDB filling the gaps' do
      rows = Show.get_series('lupin')

      expect(names(rows)).to eq ['Lupin, Season 1', 'Lupin, Season 2', 'Lupin, Season 3']
      expect(rows.first(2).map { |row| row[:appleTvId] }).to eq %w[umc.cmc.lupin umc.cmc.lupin]
      expect(rows.last[:collectionId]).to eq 'tmdb966773'
    end

    it 'fills every field the add form posts' do
      apple, _, tmdb = Show.get_series('lupin')

      expect(apple).to eq(appleTvId: 'umc.cmc.lupin', title: 'Lupin', collectionName: 'Lupin, Season 1', collectionId: 'umc.cmc.lupin-s1', season: '1',
                          rating: 'TV-MA', genre: 'Drama', plot: 'Lupin on Apple', year: '2021', poster: 'https://is1-ssl.mzstatic.com/umc.cmc.lupin/1/600x600.jpg',
                          skip: 0, count: 5, storeId: '143441', show_collection_id: 'umc.cmc.lupin')
      expect(tmdb).to eq(title: 'Lupin', collectionName: 'Lupin, Season 3', collectionId: 'tmdb966773', season: '3', poster: 'https://image.tmdb.org/t/p/original/96677-3.jpg',
                         rating: 'TV-14', year: '2021', plot: 'Lupin season 3', genre: 'Crime', show_collection_id: '96677')
    end
  end

  it 'prefers a season already in the database over Apple’s copy' do
    show = Show.create!(title: 'Lupin', year: '2021', show_collection_id: 'umc.cmc.lupin')
    season = show.seasons.create!(season: 1, collectionName: 'Lupin, Season 1', collectionId: 'umc.cmc.lupin-s1', appleTvId: 'umc.cmc.lupin', storeId: '143441')
    stub_request(:get, %r{\Ahttps://tv\.apple\.com/api/uts/v2/view/show/umc\.cmc\.lupin/episodes\?}).to_return(json(apple_episodes('umc.cmc.lupin', [[1, 10], [2, 5]])))
    stub_apple_search('lupin', shows: [['umc.cmc.lupin', 'Lupin']])
    stub_apple_show('umc.cmc.lupin', title: 'Lupin', seasons: [[1, 5], [2, 5]])

    rows = Show.get_series('lupin')

    first = rows.select { |row| row[:collectionName] == 'Lupin, Season 1' }
    expect(first.size).to eq 1
    expect(first.first).to include(id: season.id, count: '10', title: 'Lupin')
    expect(names(rows)).to eq ['Lupin, Season 1', 'Lupin, Season 2']
  end

  it 'keeps same-named shows from different years' do
    stub_tmdb_search('the office', [[2316, 'The Office', 2005], [2996, 'The Office', 2001]])
    stub_tmdb_show(2316, name: 'The Office', seasons: [1, 2])
    stub_tmdb_show(2996, name: 'The Office', seasons: [1, 2])

    rows = Show.get_series('the office')

    expect(rows.map { |row| [row[:collectionName], row[:year], row[:show_collection_id]] }).to eq [
      ['The Office, Season 1', '2001', '2996'], ['The Office, Season 2', '2001', '2996'],
      ['The Office, Season 1', '2005', '2316'], ['The Office, Season 2', '2005', '2316']
    ]
  end

  it 'keeps the first of two same-named shows from the same year' do
    stub_tmdb_search('the office', [[2316, 'The Office', 2005], [9999, 'The Office', 2005]])
    stub_tmdb_show(2316, name: 'The Office', seasons: [1, 2])
    stub_tmdb_show(9999, name: 'The Office', seasons: [1, 2])

    rows = Show.get_series('the office')

    expect(names(rows)).to eq ['The Office, Season 1', 'The Office, Season 2']
    expect(rows.map { |row| row[:show_collection_id] }).to eq %w[2316 2316]
  end

  it 'treats a show Apple and TMDB date a year apart as one show, Apple winning' do
    stub_apple_search('the office', shows: [['office-uk', 'The Office']])
    stub_apple_show('office-uk', title: 'The Office', seasons: [[1, 6], [2, 6]], year: 2002)
    stub_tmdb_search('the office', [[2996, 'The Office', 2001], [2316, 'The Office', 2005]])
    stub_tmdb_show(2996, name: 'The Office', seasons: [1, 2])
    stub_tmdb_show(2316, name: 'The Office', seasons: [1, 2])

    rows = Show.get_series('the office')

    expect(rows.map { |row| [row[:collectionName], row[:year], row[:show_collection_id]] }).to eq [
      ['The Office, Season 1', '2002', 'office-uk'], ['The Office, Season 2', '2002', 'office-uk'],
      ['The Office, Season 1', '2005', '2316'], ['The Office, Season 2', '2005', '2316']
    ]
  end

  it 'keeps an Apple season whose year differs from the database show of the same name' do
    Show.create!(title: 'The Office', year: '2001', show_collection_id: 'office-uk').seasons.create!(season: 1, collectionName: 'The Office, Season 1', collectionId: 'office-uk-s1')
    stub_apple_search('the office', shows: [['office-us', 'The Office']])
    stub_apple_show('office-us', title: 'The Office', seasons: [[1, 6]], year: 2005)

    rows = Show.get_series('the office')

    expect(rows.map { |row| [row[:collectionName], row[:year]] }).to eq [['The Office, Season 1', '2001'], ['The Office, Season 1', '2005']]
  end

  context 'a show already in the database' do
    def store_lupin(id, seasons)
      show = Show.create!(title: 'Lupin', year: '2021', show_collection_id: id)
      seasons.each { |number| show.seasons.create!(season: number, collectionName: "Lupin, Season #{number}", collectionId: "#{id}-s#{number}") }
    end

    def sources(rows) = rows.map { |row| [row[:collectionName], row[:id] ? 'db' : row[:show_collection_id]] }

    before { stub_apple_search('lupin', shows: [['umc.cmc.lupin', 'Lupin']]) }

    it 'takes its missing season from TMDB when stored with the TMDB id, and nothing from Apple' do
      store_lupin('96677', [1, 2])
      stub_apple_show('umc.cmc.lupin', title: 'Lupin', seasons: [[1, 5], [2, 5], [3, 7]])
      stub_tmdb_search('lupin', [[96677, 'Lupin']])
      stub_tmdb_show(96677, name: 'Lupin', seasons: [1, 2, 3])

      expect(sources(Show.get_series('lupin'))).to eq [['Lupin, Season 1', 'db'], ['Lupin, Season 2', 'db'], ['Lupin, Season 3', '96677']]
    end

    it 'drops a season only the other source has' do
      store_lupin('96677', [1, 2])
      stub_apple_show('umc.cmc.lupin', title: 'Lupin', seasons: [[1, 5], [2, 5], [3, 7], [4, 6]])
      stub_tmdb_search('lupin', [[96677, 'Lupin']])
      stub_tmdb_show(96677, name: 'Lupin', seasons: [1, 2])

      expect(sources(Show.get_series('lupin'))).to eq [['Lupin, Season 1', 'db'], ['Lupin, Season 2', 'db']]
    end

    it 'takes its missing season from Apple when stored with the Apple id, and nothing from TMDB' do
      store_lupin('umc.cmc.lupin', [1])
      stub_apple_show('umc.cmc.lupin', title: 'Lupin', seasons: [[1, 5], [2, 5]])
      stub_tmdb_search('lupin', [[96677, 'Lupin']])
      stub_tmdb_show(96677, name: 'Lupin', seasons: [1, 2, 3])

      expect(sources(Show.get_series('lupin'))).to eq [['Lupin, Season 1', 'db'], ['Lupin, Season 2', 'umc.cmc.lupin']]
    end

    it 'offers only its own seasons when no source returns its id' do
      store_lupin('tvdb-lupin', [1])
      stub_apple_show('umc.cmc.lupin', title: 'Lupin', seasons: [[1, 5], [2, 5], [3, 7]])
      stub_tmdb_search('lupin', [[96677, 'Lupin']])
      stub_tmdb_show(96677, name: 'Lupin', seasons: [1, 2, 3])

      expect(sources(Show.get_series('lupin'))).to eq [['Lupin, Season 1', 'db']]
    end
  end

  context 'names spelled with a curly apostrophe on Apple' do
    before do
      stub_apple_search('lupin', shows: [['umc.cmc.tales', 'Lupin’s Tales']])
      stub_apple_show('umc.cmc.tales', title: 'Lupin’s Tales', seasons: [[1, 6], [2, 6]], year: 2020)
    end

    it 'treats them as the same name as TMDB’s straight apostrophe, Apple winning' do
      stub_tmdb_search('lupin', [[129874, "Lupin's Tales"]])
      stub_tmdb_show(129874, name: "Lupin's Tales", seasons: [1, 2])

      expect(Show.get_series('lupin').map { |row| [row[:collectionName], row[:show_collection_id]] }).to eq [
        ['Lupin’s Tales, Season 1', 'umc.cmc.tales'], ['Lupin’s Tales, Season 2', 'umc.cmc.tales']
      ]
    end

    it 'matches them to a stored show spelled with a straight apostrophe' do
      Show.create!(title: "Lupin's Tales", year: '2021', show_collection_id: '129874').seasons.create!(season: 1, collectionName: "Lupin's Tales, Season 1", collectionId: 'tmdb1298741')

      expect(Show.get_series('lupin').map { |row| row[:collectionName] }).to eq ["Lupin's Tales, Season 1"]
    end
  end

  it 'sorts by year, then title, then season' do
    stub_tmdb_search('lupin', [[1, 'Lupin', 2021], [2, 'Lupin the Third', 1971]])
    stub_tmdb_show(1, name: 'Lupin', seasons: [2, 1])
    stub_tmdb_show(2, name: 'Lupin the Third', seasons: [1])

    expect(names(Show.get_series('lupin'))).to eq ['Lupin the Third, Season 1', 'Lupin, Season 1', 'Lupin, Season 2']
  end

  context 'with every source at once' do
    let(:apple) { %r{uts-api\.itunes\.apple\.com} }
    let(:tmdb) { %r{api\.themoviedb\.org} }

    before do
      stub_apple_search('lupin', shows: [['lupin', 'Lupin'], ['lupin-iii', 'Lupin III'], ['lupin-zero', 'Lupin Zero']])
      stub_apple_show('lupin', title: 'Lupin', seasons: [[1, 5], [2, 5]])
      stub_apple_show('lupin-iii', title: 'Lupin III', seasons: [[1, 9]])
      stub_apple_show('lupin-zero', title: 'Lupin Zero', seasons: [[1, 6]])
      # 8 TMDB shows fit one round of 8 parallel requests, keeping the overlap timing below to two responses deep.
      results = [[96677, 'Lupin']] + (1..7).map { |n| [n, "Lupin #{n}"] }
      stub_tmdb_search('lupin', results)
      results.each { |id, name| stub_tmdb_show(id, name: name, seasons: [1, 2]) }
    end

    it 'merges the same way when TMDB answers before Apple' do
      in_order = Show.get_series('lupin')
      delays[:apple] = 0.2

      expect(Show.get_series('lupin')).to eq in_order
      expect(in_order.find { |row| row[:collectionName] == 'Lupin, Season 1' }[:appleTvId]).to eq 'lupin'
    end

    it 'runs the database checks, Apple and TMDB at the same time' do
      show = Show.create!(title: 'Lupin', year: '2021', show_collection_id: 'lupin')
      show.seasons.create!(season: 1, collectionName: 'Lupin, Season 1', collectionId: 'lupin-s1', appleTvId: 'lupin', storeId: '143441')
      stub_request(:get, %r{\Ahttps://tv\.apple\.com/api/uts/v2/view/show/lupin/episodes\?}).to_return(&answer(:apple) { apple_episodes('lupin', [[1, 5]]) })
      delays[:apple] = delays[:tmdb] = 0.5
      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      Show.get_series('lupin')
    
      # One after another: 0.5 (database check) + 1.0 (Apple search, then details) + 1.0 (TMDB search, then shows).
      expect(search_requests(/#{apple}|#{tmdb}|tv\.apple\.com/)).to be >= 20
      expect(Process.clock_gettime(Process::CLOCK_MONOTONIC) - started).to be < 1.6
    end

    it 'keeps the database and TMDB entries when Apple fails' do
      Show.create!(title: 'Lupin', year: '2021', show_collection_id: '96677').seasons.create!(season: 4, collectionName: 'Lupin, Season 4', collectionId: 'tmdb966774')
      stub_request(:get, apple).to_return(status: 500, body: 'oops')

      rows = Show.get_series('lupin')

      expect(rows.map { |row| row[:collectionName] }).to include('Lupin, Season 4', 'Lupin, Season 1', 'Lupin 7, Season 2')
      expect(rows.find { |row| row[:collectionName] == 'Lupin, Season 1' }[:collectionId]).to eq 'tmdb966771'
    end
  end

  context 'TMDB' do
    it 'makes one request per show on top of the search' do
      results = (1..20).map { |n| [n, "Lupin #{n}"] }
      stub_tmdb_search('lupin', results)
      results.each { |id, name| stub_tmdb_show(id, name: name, seasons: [1, 2, 3]) }

      rows = Show.get_series('lupin')

      expect(rows.size).to eq 60
      expect(search_requests(%r{api\.themoviedb\.org})).to eq 21
    end

    it 'asks again for seasons past the 19 one request can carry' do
      stub_tmdb_search('survivor', [[14658, 'Survivor']])
      stub_tmdb_show(14658, name: 'Survivor', seasons: (1..25).to_a)

      rows = Show.get_series('survivor')

      expect(rows.map { |row| row[:season] }).to eq (1..25).map(&:to_s)
      expect(search_requests(%r{api\.themoviedb\.org(:443)?/3/tv/})).to eq 2
    end
  end

  context 'Apple' do
    def apple_views(id = '[^/?]+') = search_requests(%r{/uts/v2/view/show/#{id}\?})

    it 'keeps shows whose title contains a partial term, and no others' do
      stub_apple_search('the offi', shows: [['office', 'The Office'], ['superfan', 'The Office: Superfan Episodes'], ['parks', 'Parks and Recreation']])
      stub_apple_show('office', title: 'The Office', seasons: [[1, 6]])
      stub_apple_show('superfan', title: 'The Office: Superfan Episodes', seasons: [[1, 3]])
      stub_apple_show('parks', title: 'Parks and Recreation', seasons: [[1, 6]])

      expect(names(Show.get_series('the offi'))).to contain_exactly('The Office, Season 1', 'The Office: Superfan Episodes, Season 1')
      expect(apple_views('parks')).to eq 0
    end

    it 'fetches at most 10 shows, exact title first' do
      others = (1..14).map { |n| ["lupin-#{n}", "Lupin Story #{n}"] }
      stub_apple_search('lupin', shows: others + [['lupin', 'Lupin']])
      (others + [['lupin', 'Lupin']]).each { |id, title| stub_apple_show(id, title: title, seasons: [[1, 2]]) }

      rows = Show.get_series('lupin')

      expect(apple_views).to eq 10
      expect(names(rows)).to include('Lupin, Season 1')
    end

    it 'ranks titles starting with the term above titles containing it' do
      contains = (1..10).map { |n| ["arsene-#{n}", "Arsène Lupin #{n}"] }
      stub_apple_search('lupin', shows: contains + [['the-third', 'Lupin the Third']])
      (contains + [['the-third', 'Lupin the Third']]).each { |id, title| stub_apple_show(id, title: title, seasons: [[1, 2]]) }

      expect(names(Show.get_series('lupin'))).to include('Lupin the Third, Season 1')
      expect(apple_views('arsene-10')).to eq 0
    end

    it 'fetches a show found in every storefront once, from the US' do
      ShowSearchStubs::STORES.each { |store| stub_apple_search('lupin', store: store, shows: [['lupin', 'Lupin']]) }
      stub_apple_show('lupin', title: 'Lupin', seasons: [[1, 5]])

      rows = Show.get_series('lupin')

      expect(apple_views('lupin')).to eq 1
      expect(rows.map { |row| row[:storeId] }).to eq ['143441']
    end

    it 'fetches a show found only in the UK from the UK' do
      stub_apple_search('lupin', store: '143444', shows: [['lupin', 'Lupin']])
      stub_apple_show('lupin', title: 'Lupin', seasons: [[1, 5]])

      expect(Show.get_series('lupin').map { |row| row[:storeId] }).to eq ['143444']
      expect(search_requests(%r{/uts/v2/view/show/lupin\?.*\bsf=143444\b})).to eq 1
    end
  end
end

describe 'Show.plex_add with the wider Apple match' do
  include ShowSearchStubs

  before do
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?}).to_return(json(data: { canvas: { shelves: [] } }))
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/tv\?}).to_return(json(results: []))
  end

  it 'imports a new episode into the show with the exact title, not the partial matches' do
    user = create_user
    stub_apple_search('lupin', shows: [['lupin-third', 'Lupin the Third'], ['lupin', 'Lupin']])
    stub_apple_show('lupin-third', title: 'Lupin the Third', seasons: [[1, 23]])
    stub_apple_show('lupin', title: 'Lupin', seasons: [[1, 5]])
    stub_request(:get, %r{\Ahttps://tv\.apple\.com/api/uts/v2/view/show/lupin/episodes\?})
      .with(query: hash_including('skip' => '1', 'count' => '1'))
      .to_return(json(data: { episodes: [{ title: 'Chapter 2', description: 'The second chapter', episodeNumber: 2, duration: 2700,
                                           releaseDate: Time.utc(2021, 1, 8).to_i * 1000, images: { previewFrame: { url: 'https://is1-ssl.mzstatic.com/ep2/{w}x{h}.{f}' } } }] }))

    Show.plex_add({ 'type' => 'episode', 'grandparentTitle' => 'Lupin', 'parentIndex' => 1, 'index' => 2, 'title' => 'Chapter 2', 'year' => 2021 }, user.id)

    show = user.shows.reload.sole
    expect([show.title, show.show_collection_id]).to eq ['Lupin', 'lupin']
    expect(show.seasons.sole.attributes.slice('season', 'collectionId', 'storeId')).to eq('season' => 1, 'collectionId' => 'lupin-s1', 'storeId' => '143441')
    expect(show.seasons.sole.episodes.pluck(:tv_episode, :title)).to eq [[2, 'Chapter 2']]
  end
end
