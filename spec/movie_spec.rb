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

describe Movie, '.search_person' do
  def stub_person(results)
    stub_request(:get, 'https://api.themoviedb.org/3/search/person')
      .with(query: { 'query' => 'Sylvester Stallone' }, headers: { 'Authorization' => "Bearer #{ENV['TMDB_TOKEN']}" })
      .to_return(body: { results: results }.to_json, headers: { 'Content-Type' => 'application/json' })
  end

  it "returns the first person's profile image" do
    stub_person([{ profile_path: '/stallone.jpg' }])

    expect(Movie.search_person('Sylvester Stallone')).to eq 'https://image.tmdb.org/t/p/w342/stallone.jpg'
  end

  it 'returns nil when nobody is found' do
    stub_person([])

    expect(Movie.search_person('Sylvester Stallone')).to be_nil
  end
end

describe 'GET /movies/search' do
  it "looks up the person's image once" do
    user = create_user
    stub = stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/person\?})
      .to_return(body: { results: [{ profile_path: '/stallone.jpg' }] }.to_json, headers: { 'Content-Type' => 'application/json' })

    response = get('/movies/search', params: { filter: 'Sylvester Stallone', id: user.id })

    expect(JSON.parse(response.body)['url']).to eq 'https://image.tmdb.org/t/p/w342/stallone.jpg'
    expect(stub).to have_been_requested.once
  end
end
