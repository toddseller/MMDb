describe 'POST /v1/webhooks/new' do
  let(:secret) { ENV['PLEX_WEBHOOK_SECRET'] }

  def event(account: ENV['PLEX_USER'], type: 'library.new', section: 'show')
    { 'event' => type, 'Account' => { 'title' => account }, 'Metadata' => { 'librarySectionType' => section, 'title' => 'Dark' } }
  end

  # Plex sends the event as a multipart `payload` field; other senders post JSON.
  def deliver(payload, token:, as: :form)
    path = token ? "/v1/webhooks/new?token=#{token}" : '/v1/webhooks/new'
    as == :form ? post(path, params: { payload: payload.to_json }, xhr: false) : post(path, json: payload, xhr: false)
  end

  before do
    allow(Show).to receive(:plex_add)
    allow(Movie).to receive(:plex_add)
  end

  [:form, :json].each do |format|
    it "imports a new show sent as #{format} with the correct token" do
      expect(deliver(event, token: secret, as: format).status).to eq 204
      expect(Show).to have_received(:plex_add).once
    end
  end

  {
    'a wrong token' => 'not-the-secret',
    'no token' => nil
  }.each do |description, token|
    it "rejects #{description}" do
      expect(deliver(event, token: token).status).to eq 401
      expect(Show).not_to have_received(:plex_add)
    end
  end

  it 'rejects every request when no secret is configured' do
    saved = ENV.delete('PLEX_WEBHOOK_SECRET')
    expect(deliver(event, token: saved).status).to eq 401
    expect(deliver(event, token: '').status).to eq 401
    expect(Show).not_to have_received(:plex_add)
  ensure
    ENV['PLEX_WEBHOOK_SECRET'] = saved
  end

  it 'ignores another Plex account' do
    expect(deliver(event(account: 'someone-else'), token: secret).status).to eq 204
    expect(Show).not_to have_received(:plex_add)
  end

  it 'ignores events other than library.new' do
    expect(deliver(event(type: 'media.play'), token: secret).status).to eq 204
    expect(Show).not_to have_received(:plex_add)
  end
end
