describe Movie, '#thumbnail' do
  def thumbnail_for(poster)
    Movie.new(title: 'Test', poster: poster).thumbnail
  end

  it 'requests Apple TV artwork at twice the 174x261 tile, whatever size is stored' do
    movie = Movie.new(title: 'Test', poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/ab/cd/x.jpg/2000x3000.jpg')
    expect(movie.thumbnail).to eq 'https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/ab/cd/x.jpg/348x522bb.jpg'
    expect(movie.poster).to eq 'https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/ab/cd/x.jpg/2000x3000.jpg'
    expect(thumbnail_for('https://is1-ssl.mzstatic.com/image/thumb/Video/abc/800x1200bb.jpg')).to eq 'https://is1-ssl.mzstatic.com/image/thumb/Video/abc/348x522bb.jpg'
  end

  it 'keeps the image format Apple was asked for' do
    expect(thumbnail_for('https://is1-ssl.mzstatic.com/image/thumb/Video/abc/1400x2100.png')).to eq 'https://is1-ssl.mzstatic.com/image/thumb/Video/abc/348x522bb.png'
  end

  it 'leaves other hosts unchanged' do
    [
      'https://image.tmdb.org/t/p/w342/u6accimG7LmroR8WgNklEJS7oFq.jpg',
      'https://cdn.myflix.stream/images/fwvbDIRjmXEQAY1PGurn0qzPoJt.jpg',
      'https://is1-ssl.mzstatic.com/image/thumb/Video/abc/poster.jpg'
    ].each { |url| expect(thumbnail_for(url)).to eq url }
  end

  it 'returns an empty string without a poster' do
    expect(thumbnail_for(nil)).to eq ''
  end
end
