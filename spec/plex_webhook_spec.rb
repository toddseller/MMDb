describe 'POST /v1/webhooks/new' do
  let(:secret) { ENV['PLEX_WEBHOOK_SECRET'] }

  def event(account: ENV['PLEX_USER'], type: 'library.new', section: 'show')
    { 'event' => type, 'Account' => { 'title' => account }, 'Metadata' => { 'librarySectionType' => section, 'title' => 'Dark' } }
  end

  # Built by hand because Rack turns a `payload` part with a filename into an uploaded-file Hash.
  def multipart(body, filename: nil)
    head = %(Content-Disposition: form-data; name="payload")
    head += %(; filename="#{filename}"\r\nContent-Type: application/json) if filename
    ['--X', head, '', body, '--X--', ''].join("\r\n")
  end

  # Plex sends the event as a multipart `payload` part; other senders post JSON.
  def deliver(payload, token:, as: :text)
    path = token ? "/v1/webhooks/new?token=#{token}" : '/v1/webhooks/new'
    return post(path, json: payload, xhr: false, once: true) if as == :json

    body = multipart(payload.is_a?(String) ? payload : payload.to_json, filename: (as == :file ? 'payload.json' : nil))
    post(path, env: { input: body, 'CONTENT_TYPE' => 'multipart/form-data; boundary=X' }, xhr: false, once: true)
  end

  before do
    allow(Show).to receive(:plex_add)
    allow(Movie).to receive(:plex_add)
  end

  { text: 'a text field', file: 'a file part', json: 'a JSON body' }.each do |format, description|
    it "imports a new show sent as #{description} with the correct token" do
      expect(deliver(event, token: secret, as: format).status).to eq 204
      expect(Show).to have_received(:plex_add).once
    end
  end

  it 'answers 400 to a payload that is not JSON' do
    expect(deliver('{not json', token: secret).status).to eq 400
    expect(Show).not_to have_received(:plex_add)
  end

  it 'answers 400 to a request without an event' do
    expect(post("/v1/webhooks/new?token=#{secret}", xhr: false).status).to eq 400
    expect(Show).not_to have_received(:plex_add)
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

  describe 'shape log' do
    def stdout_of
      original, $stdout = $stdout, StringIO.new
      yield
      $stdout.string
    ensure
      $stdout = original
    end

    def shape_lines(output) = output.lines.grep(/plex webhook:/)

    it 'names the content type, parameters and a file payload without values' do
      lines = shape_lines(stdout_of { deliver(event, token: secret, as: :file) })
      expect(lines.size).to eq 1
      expect(lines.first).to include('content_type=multipart/form-data', 'payload=file(application/json)').and match(/params=\[[^\]]*"payload"/)
      expect(lines.first).not_to include('Dark', 'library.new', secret)
    end

    it 'marks a text payload' do
      expect(shape_lines(stdout_of { deliver(event, token: secret, as: :text) }).first).to include('payload=text')
    end

    it 'marks a JSON body as having no payload field' do
      expect(shape_lines(stdout_of { deliver(event, token: secret, as: :json) }).first).to include('content_type=application/json', 'payload=none')
    end
  end

  it 'keeps the token out of the access log, correct or not' do
    log = StringIO.new
    app = Rack::CommonLogger.new(RequestHelper::APP, Logger.new(log))
    [secret, 'wrong-token'].each do |token|
      env = Rack::MockRequest.env_for("/v1/webhooks/new?token=#{token}", method: 'POST', input: multipart(event.to_json), 'CONTENT_TYPE' => 'multipart/form-data; boundary=X')
      app.call(env)[2].close
    end
    expect(log.string).to include('/v1/webhooks/new')
    expect(log.string).not_to include(secret, 'wrong-token')
  end
end
