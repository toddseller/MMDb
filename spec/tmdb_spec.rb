describe Tmdb, '.get' do
  let(:json_headers) { { 'Content-Type' => 'application/json' } }

  it 'sends each parameter as one escaped value' do
    stub = stub_request(:get, 'https://api.themoviedb.org/3/search/movie')
      .with(query: { 'query' => 'fast & furious' })
      .to_return(body: { results: [] }.to_json, headers: json_headers)

    Tmdb.get('search/movie', query: 'fast & furious')

    expect(stub).to have_been_requested
  end

  it 'authenticates with the bearer token' do
    stub = stub_request(:get, 'https://api.themoviedb.org/3/movie/1366')
      .with(headers: { 'Authorization' => "Bearer #{ENV['TMDB_TOKEN']}" })
      .to_return(body: { id: 1366 }.to_json, headers: json_headers)

    Tmdb.get('movie/1366')

    expect(stub).to have_been_requested
  end

  it 'returns the status code and the parsed body' do
    stub_request(:get, 'https://api.themoviedb.org/3/movie/1366').to_return(body: { id: 1366 }.to_json, headers: json_headers)

    expect(Tmdb.get('movie/1366')).to eq(code: '200', body: { 'id' => 1366 })
  end
end
