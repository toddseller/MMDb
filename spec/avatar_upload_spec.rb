AVATAR_OBJECT = %r{\Ahttps://myflix-stream\.s3\.us-west-2\.amazonaws\.com/avatars/([A-Za-z0-9]{27})\.(jpg|png)\z}
AVATAR_JPEG = "\xFF\xD8\xFF\xE0".b + ('j' * 200)
AVATAR_PNG = "\x89PNG\r\n\x1A\n".b + ('p' * 200)

describe 'Artwork.store into another folder' do
  before { stub_request(:put, AVATAR_OBJECT) }

  it 'puts the file under that folder' do
    url = Artwork.store(StringIO.new(AVATAR_JPEG), folder: 'avatars', name: 'Avatars')

    expect(url).to match(%r{\Ahttps://cdn\.myflix\.stream/avatars/[A-Za-z0-9]{27}\.jpg\z})
    expect(a_request(:put, AVATAR_OBJECT)).to have_been_made.once
  end

  it 'names the folder in its size message' do
    too_big = StringIO.new(AVATAR_JPEG + ('j' * (5 * 1024 * 1024)))

    expect { Artwork.store(too_big, folder: 'avatars', name: 'Avatars') }.to raise_error(Artwork::Invalid, 'Avatars must be 5 MB or smaller.')
  end
end

describe 'POST /api/v2/avatar' do
  let(:user) { create_user }
  let(:other) { create_user }

  before { stub_request(:put, AVATAR_OBJECT) }

  def upload(bytes, token: JwtAuth.token(user, lifetime: 3600), filename: 'me.jpg', type: 'image/jpeg')
    body = Rack::Multipart.build_multipart('avatar' => Rack::Multipart::UploadedFile.new(nil, type, true, io: StringIO.new(bytes), filename: filename))
    env = { input: body, 'CONTENT_TYPE' => "multipart/form-data; boundary=#{Rack::Multipart::MULTIPART_BOUNDARY}" }
    env['HTTP_AUTHORIZATION'] = "bearer #{token}" if token
    post('/api/v2/avatar', env: env)
  end

  def error_of(response) = [response.status, JSON.parse(response.body)['error']]

  context 'with a valid token' do
    it "stores a JPEG and saves its URL as the user's avatar" do
      other
      response = upload(AVATAR_JPEG)

      expect(response.status).to eq 200
      url = JSON.parse(response.body)['avatar']
      expect(url).to match(%r{\Ahttps://cdn\.myflix\.stream/avatars/[A-Za-z0-9]{27}\.jpg\z})
      expect(a_request(:put, "https://myflix-stream.s3.us-west-2.amazonaws.com#{URI(url).path}").with(headers: { 'Content-Type' => 'image/jpeg' }, body: /#{Regexp.escape(AVATAR_JPEG)}/n)).to have_been_made.once
      expect(user.reload.avatar).to eq url
      expect(other.reload.avatar).to eq ''
    end

    it 'stores a PNG with its own extension and type' do
      url = JSON.parse(upload(AVATAR_PNG, filename: 'me.png', type: 'image/png').body)['avatar']

      expect(url).to end_with('.png')
      expect(a_request(:put, "https://myflix-stream.s3.us-west-2.amazonaws.com#{URI(url).path}").with(headers: { 'Content-Type' => 'image/png' })).to have_been_made
      expect(user.reload.avatar).to eq url
    end

    it 'returns the new avatar at the next sign-in' do
      url = JSON.parse(upload(AVATAR_JPEG).body)['avatar']
      response = post('/api/v2/authenticate', json: { username_email: user.email, password: 'secret-password' })

      expect(JSON.parse(response.body)['user']['avatar']).to eq url
    end
  end

  context 'without a valid token' do
    now = Time.now.to_i
    {
      'no token' => ->(_) { nil },
      'an expired token' => ->(u) { JWT.encode({ sub: u.id, iss: ENV['JWT_ISSUER'], exp: now - 1, pwd: u.password_fingerprint }, ENV['JWT_SECRET'], 'HS256') },
      'a forged token' => ->(u) { JWT.encode({ sub: u.id, iss: ENV['JWT_ISSUER'], exp: now + 3600, pwd: u.password_fingerprint }, 'another-secret', 'HS256') }
    }.each do |description, build|
      it "answers 401 for #{description} and stores nothing" do
        expect(upload(AVATAR_JPEG, token: build.call(user)).status).to eq 401
        expect(a_request(:put, AVATAR_OBJECT)).not_to have_been_made
        expect(user.reload.avatar).to eq ''
      end
    end
  end

  context 'with a file it cannot take' do
    it 'rejects a text file dressed up as a JPEG' do
      expect(error_of(upload('just some text'))).to eq [422, 'Only JPEG and PNG files are accepted.']
      expect(a_request(:put, AVATAR_OBJECT)).not_to have_been_made
      expect(user.reload.avatar).to eq ''
    end

    it 'rejects a JPEG over 5 MB' do
      expect(error_of(upload(AVATAR_JPEG + ('j' * (5 * 1024 * 1024))))).to eq [422, 'Avatars must be 5 MB or smaller.']
      expect(a_request(:put, AVATAR_OBJECT)).not_to have_been_made
      expect(user.reload.avatar).to eq ''
    end

    it 'rejects a request without a file' do
      response = post('/api/v2/avatar', env: { 'HTTP_AUTHORIZATION' => "bearer #{JwtAuth.token(user, lifetime: 3600)}" })

      expect(error_of(response)).to eq [422, 'Choose a JPEG or PNG file to upload.']
      expect(a_request(:put, AVATAR_OBJECT)).not_to have_been_made
      expect(user.reload.avatar).to eq ''
    end
  end

  context 'when storage fails' do
    it 'answers 502 without the storage details' do
      stub_request(:put, AVATAR_OBJECT).to_return(status: 403, body: '<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>')
      response = nil
      expect { response = upload(AVATAR_JPEG) }.to output("avatars upload failed: Aws::S3::Errors::AccessDenied\n").to_stderr

      expect(error_of(response)).to eq [502, "The avatar couldn't be stored. Try again."]
      expect(response.body).not_to include('AccessDenied')
      expect(user.reload.avatar).to eq ''
    end

    context 'because the server has no credentials' do
      # Without these the SDK would fall back to ~/.aws on the developer's machine or the EC2 metadata endpoint.
      lookups = { 'AWS_ACCESS_KEY_ID' => nil, 'AWS_SECRET_ACCESS_KEY' => nil, 'AWS_SHARED_CREDENTIALS_FILE' => '/nonexistent',
                  'AWS_CONFIG_FILE' => '/nonexistent', 'AWS_EC2_METADATA_DISABLED' => 'true' }

      around do |example|
        saved = lookups.keys.to_h { |name| [name, ENV[name]] }
        lookups.each { |name, value| ENV[name] = value }
        example.run
      ensure
        saved.each { |name, value| ENV[name] = value }
      end

      it 'answers 502 and stores nothing' do
        response = nil
        expect { response = upload(AVATAR_JPEG) }.to output(/avatars upload failed: Aws::Errors::MissingCredentialsError/).to_stderr

        expect(error_of(response)).to eq [502, "The avatar couldn't be stored. Try again."]
        expect(a_request(:put, AVATAR_OBJECT)).not_to have_been_made
        expect(user.reload.avatar).to eq ''
      end
    end
  end

  it 'allows a preflight from myflix.stream with an Authorization header' do
    response = request('OPTIONS', '/api/v2/avatar', xhr: false, env: { 'HTTP_ORIGIN' => 'https://myflix.stream',
                                                                         'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
                                                                         'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'authorization' })

    expect(response['access-control-allow-origin']).to eq 'https://myflix.stream'
    expect(response['access-control-allow-methods']).to include('POST')
    expect(response['access-control-allow-headers'].downcase).to include('authorization')
  end
end
