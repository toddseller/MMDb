describe '/api/movies/count' do
  let(:tautulli) { %r{\Ahttps://plex\.toddseller\.dev/api/v2\?} }

  def stub_libraries
    stub_request(:get, tautulli).with(query: hash_including('cmd' => 'get_libraries'))
      .to_return(body: { response: { data: [{ count: 1200 }, { count: 300, child_count: 9000 }] } }.to_json, headers: { 'Content-Type' => 'application/json' })
  end

  it 'reports the Plex library counts from Tautulli' do
    stub_libraries

    expect(JSON.parse(get('/api/movies/count', xhr: false).body)).to eq('movies' => 1200, 'shows' => 300, 'episodes' => 9000)
  end

  # Production runs one Puma thread, so a stalled Tautulli would otherwise hold every request for Net::HTTP's 60 + 60 seconds.
  it 'gives Tautulli 5 seconds' do
    timeouts = []
    allow(HTTParty).to receive(:get).and_wrap_original do |get, url, *options|
      timeouts << options.first&.dig(:timeout) if url.match?(tautulli)
      get.call(url, *options)
    end
    stub_libraries

    get('/api/movies/count', xhr: false)

    expect(timeouts).to eq [5]
  end

  # Sinatra re-raises errors in tests; production answers the same error with a 500.
  it "fails instead of waiting when Tautulli doesn't answer in time" do
    stub_request(:get, tautulli).to_timeout

    expect { get('/api/movies/count', xhr: false) }.to raise_error(Net::OpenTimeout)
  end
end
