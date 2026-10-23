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
    expect(thumbnail_for(nil)).to eq 'deliberately wrong'
  end
end
