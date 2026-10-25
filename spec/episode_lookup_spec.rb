describe 'Apple episode lookups' do
  include ShowSearchStubs

  def episodes_url = %r{\Ahttps://tv\.apple\.com/api/uts/v2/view/show/lupin/episodes\?}

  def apple_episode(number) = { title: "Chapter #{number}", description: "Chapter #{number} of Lupin", episodeNumber: number, duration: 2700,
                                releaseDate: Time.utc(2021, 1, 8).to_i * 1000, images: { previewFrame: { url: "https://is1-ssl.mzstatic.com/ep#{number}/{w}x{h}.{f}" } } }

  def stub_episodes(store, skip:, count:)
    stub_request(:get, episodes_url).with(query: hash_including('sf' => store, 'skip' => skip.to_s, 'count' => count.to_s))
      .to_return(json(data: { episodes: (skip + 1..skip + count).map { |number| apple_episode(number) } }))
  end

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
end
