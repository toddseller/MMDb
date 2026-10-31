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

  # Without a timeout, one stalled TMDB answer holds the single Puma thread for Net::HTTP's 60 seconds to connect and 60 to read.
  it 'gives up after 5 seconds' do
    options = nil
    allow(Net::HTTP).to receive(:start).and_wrap_original { |start, *args, **opts, &block| options = opts; start.call(*args, **opts, &block) }
    stub_request(:get, 'https://api.themoviedb.org/3/movie/1366').to_return(body: { id: 1366 }.to_json, headers: json_headers)

    Tmdb.get('movie/1366')

    expect(options).to include(open_timeout: 5, read_timeout: 5)
  end
end
