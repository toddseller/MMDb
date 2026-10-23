describe 'outbound HTTP in tests' do
  let(:url) { 'https://api.themoviedb.org/3/search/tv?query=dark' }

  it 'fails an unstubbed request and names its URL' do
    expect { HTTParty.get(url) }.to raise_error(WebMock::NetConnectNotAllowedError, %r{api\.themoviedb\.org/3/search/tv})
  end

  it 'returns a stubbed response' do
    stub_request(:get, url).to_return(body: '{"results":[]}', headers: { 'Content-Type' => 'application/json' })
    expect(HTTParty.get(url)['results']).to eq []
  end
end
