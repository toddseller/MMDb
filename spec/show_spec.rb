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
