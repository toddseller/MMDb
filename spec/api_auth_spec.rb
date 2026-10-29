%w[v2 v3].each do |version|
  describe "/api/#{version} tokens" do
    def claims(response)
      JWT.decode(JSON.parse(response.body)['token'], nil, false).first
    end

    def lifetime_days(response)
      token = claims(response)
      (token['exp'] - token['iat']) / 86_400.0 if token['exp']
    end

    let(:user) { create_user }

    it 'lasts 30 days for a remembered login' do
      response = post("/api/#{version}/authenticate", json: { username_email: user.email, password: 'secret-password', remember: true })
      expect(lifetime_days(response)).to eq 30
    end

    it 'lasts 1 day for a login without remember' do
      response = post("/api/#{version}/authenticate", json: { username_email: user.email, password: 'secret-password' })
      expect(lifetime_days(response)).to eq 1
    end

    it 'lasts 1 day after signup' do
      response = post("/api/#{version}/signup", json: { first_name: 'New', last_name: 'User', user_name: "new#{version}", email: "new#{version}@example.test", password: 'secret-password' })
      expect(response.status).to eq 201
      expect(lifetime_days(response)).to eq 1
    end

    it 'refuses a wrong password without a token' do
      response = post("/api/#{version}/authenticate", json: { username_email: user.email, password: 'wrong' })
      expect(response.status).to eq 401
      expect(JSON.parse(response.body)).not_to have_key 'token'
    end

    it 'answers 400 to a body that is not JSON' do
      response = post("/api/#{version}/authenticate", env: { input: '{not json', 'CONTENT_TYPE' => 'application/json' })
      expect(response.status).to eq 400
      expect(JSON.parse(response.body)['error']).to eq 'Failed to parse body as JSON'
    end
  end
end

%w[v2 v3].each do |version|
  describe "/api/#{version} token checks" do
    let(:user) { create_user }
    let(:now) { Time.now.to_i }
    let(:api) { "/api/#{version}" }

    def token(secret: ENV['JWT_SECRET'], **claims)
      JWT.encode({ sub: user.id, iat: now, iss: ENV['JWT_ISSUER'], exp: now + 3600, pwd: user.password_fingerprint }.merge(claims).compact, secret, 'HS256')
    end

    def counts(token)
      get("#{api}/counts", env: token ? { 'HTTP_AUTHORIZATION' => "bearer #{token}" } : {})
    end

    {
      'an expired token' => -> { token(exp: now - 1) },
      'a token without an expiry' => -> { token(exp: nil) },
      'a token signed with another secret' => -> { token(secret: 'another-secret') },
      'a token from another issuer' => -> { token(iss: 'someone-else') },
      'no token' => -> { nil }
    }.each do |description, build|
      it "answers 401 with a message for #{description}" do
        response = counts(instance_exec(&build))
        expect(response.status).to eq 401
        expect(JSON.parse(response.body)).to have_key 'message'
      end
    end

    it 'answers with the user\'s counts for a valid token' do
      create_show(user)
      response = counts(token)
      expect(response.status).to eq 200
      expect(JSON.parse(response.body)['showsCount']).to eq 1
    end
  end
end
