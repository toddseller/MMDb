describe 'changing the password' do
  let(:user) { create_user }
  let(:movie) { create_movie(user) }

  # Rating needs a signed-in user, and unlike the navbar it doesn't depend on the session holding a name.
  def signed_in? = post("/movies/#{movie.id}/ratings", params: { rating: '4' }).status != 401

  def save_settings(**params)
    request('PUT', "/users/#{user.id}", params: { first_name: user.first_name, last_name: user.last_name, user_name: user.user_name, email: user.email, theme: 'system', current: '' }.merge(params))
  end

  # RequestHelper keeps one cookie, so each browser's is swapped in before it makes a request.
  def browser
    @cookie = nil
    log_in(user, 'secret-password')
    @cookie
  end

  describe 'web sessions' do
    it 'signs out the other browser and keeps the one that changed it' do
      first = browser
      second = browser

      @cookie = first
      save_settings(current: 'secret-password', password: 'new-password')
      expect(signed_in?).to be true

      @cookie = second
      expect(signed_in?).to be false
    end

    it 'keeps other browsers signed in when the password stays' do
      first = browser
      second = browser

      @cookie = first
      save_settings(first_name: 'Ann')

      @cookie = second
      expect(signed_in?).to be true
    end

    it 'signs out a session that carries no password fingerprint' do
      post('/api/v2/authenticate', json: { username_email: user.email, password: 'secret-password' })
      expect(signed_in?).to be false
    end
  end

  %w[v2 v3].each do |version|
    describe "/api/#{version} tokens" do
      let(:api) { "/api/#{version}" }

      def token = JwtAuth.token(user.reload, lifetime: JwtAuth::SESSION_LIFETIME)

      def counts(token) = get("#{api}/counts", env: { 'HTTP_AUTHORIZATION' => "bearer #{token}" })

      it 'rejects a token issued before the password changed, and accepts one issued after' do
        before = token
        user.update!(password: 'new-password')

        response = counts(before)
        expect(response.status).to eq 401
        expect(JSON.parse(response.body)).to have_key 'message'
        expect(counts(token).status).to eq 200
      end

      it 'rejects a token without a password fingerprint' do
        now = Time.now.to_i
        bare = JWT.encode({ sub: user.id, iat: now, iss: ENV['JWT_ISSUER'], exp: now + 3600 }, ENV['JWT_SECRET'], 'HS256')
        expect(counts(bare).status).to eq 401
      end

      # A missing user and a missing claim are both nil, which must not count as a match.
      it 'rejects a token without a password fingerprint for a user who does not exist' do
        now = Time.now.to_i
        bare = JWT.encode({ sub: 0, iat: now, iss: ENV['JWT_ISSUER'], exp: now + 3600 }, ENV['JWT_SECRET'], 'HS256')
        expect(counts(bare).status).to eq 401
      end
    end
  end
end
