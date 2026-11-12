describe Show, '#thumbnail' do
  def thumbnail_for(poster)
    Show.new(title: 'Test', poster: poster).thumbnail
  end

  it 'requests Apple TV artwork at 400x400' do
    show = Show.new(title: 'Test', poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video/abc/600x600.jpg')
    expect(show.thumbnail).to eq 'https://is1-ssl.mzstatic.com/image/thumb/Video/abc/400x400.jpg'
    expect(show.poster).to eq 'https://is1-ssl.mzstatic.com/image/thumb/Video/abc/600x600.jpg'
  end

  it 'leaves other hosts unchanged' do
    [
      'https://cdn.myflix.stream/posters/show.jpg',
      'https://artworks.thetvdb.com/banners/posters/12345-1.jpg',
      'https://s3-us-west-2.amazonaws.com/toddseller/tedflix/imgs/Artboard+1-196x196.jpg'
    ].each { |url| expect(thumbnail_for(url)).to eq url }
  end

  it 'returns an empty string without a poster' do
    expect(thumbnail_for(nil)).to eq ''
  end
end

describe Show, 'list order' do
  let(:user) { create_user }

  it 'lists shows sharing a sort name and year oldest first' do
    # An UPDATE writes a new row version at the end of the table, so without a tiebreaker Postgres returns the first show last.
    first, second = 2.times.map { create_show(user, title: 'Ghosts', seasons: []).tap { |s| s.update_columns(year: '2021') } }
    first.update_columns(genre: 'moved')

    expect(user.shows.sorted_list.to_a).to eq [first, second]
  end

  it 'lists shows added at the same moment newest first' do
    first, second = 2.times.map { create_show(user, seasons: []) }
    second.update_columns(created_at: first.created_at)

    expect(Show.where(id: [first, second]).recently_added.to_a).to eq [second, first]
  end
end

describe Season, 'specials' do
  it 'names season 0 Specials and any other season by its number' do
    expect([Season.label(0), Season.label(3)]).to eq ['Specials', 'Season 3']
    expect(Season.new(season: 0).label).to eq 'Specials'
  end

  it 'marks only season 0 as specials' do
    expect([0, 1].map { |number| Season.new(season: number).specials? }).to eq [true, false]
  end

  it 'lists specials after the regular seasons' do
    show = create_show(create_user, seasons: [0, 1, 2])

    expect(show.reload.seasons.map(&:season)).to eq [1, 2, 0]
    expect(show.seasons.sorted_seasons.map(&:season)).to eq [1, 2, 0]
  end
end

describe Show, 'counting with specials' do
  let(:show) { create_show(create_user, seasons: (0..14).to_a).reload }

  it 'leaves specials out of its regular seasons' do
    expect(show.regular_seasons.map(&:season)).to eq (1..14).to_a
  end

  it "leaves specials out of the season numbers and stored season count, but counts their episodes" do
    show.save!

    expect(show.season_numbers).to eq 14
    expect(show.attributes.slice('seasonNumbers', 'seasonCount', 'episodeCount')).to eq('seasonNumbers' => '14', 'seasonCount' => '14', 'episodeCount' => '15')
  end
end

describe Show, '#season_caption' do
  def caption(seasons) = create_show(create_user, seasons: seasons).reload.season_caption

  it 'names the seasons as the tiles always have' do
    expect([[2], [1, 3], [1, 2, 3], (1..7).to_a].map { |seasons| caption(seasons) }).to eq ['Season 2', 'Seasons 1, 3', 'Seasons 1–3', '7 seasons']
  end

  it 'leaves specials out' do
    expect([(0..14).to_a, [0, 3], [0]].map { |seasons| caption(seasons) }).to eq ['14 seasons', 'Season 3', 'Specials']
  end
end
