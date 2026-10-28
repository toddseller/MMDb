describe 'Web session expiry' do
  let(:user) { create_user }
  let(:movie) { create_movie(user) }

  def page_html = get('/', xhr: false).body

  def signed_in? = page_html.include?("Signed in as #{user.full_name}")

  def rating_status = post("/movies/#{movie.id}/ratings", params: { rating: '4' }).status

  it 'signs out a session left unused for more than a day' do
    log_in(user, 'secret')
    travel 25.hours

    expect(signed_in?).to be false
    expect(page_html).to include 'id="open-sign-in"'
    expect(rating_status).to eq 401
  end

  it 'keeps a session used every 20 hours signed in for a week' do
    log_in(user, 'secret')

    9.times do
      travel 20.hours
      expect(signed_in?).to be true
    end
  end

  it 'gives a session that ends the theme Sign Out leaves' do
    user.update_columns(theme: 'dark')
    log_in(user, 'secret')
    expect(Nokogiri::HTML(page_html).at_css('html')['data-theme']).to eq 'dark'
    travel 25.hours

    expect(Nokogiri::HTML(page_html).at_css('html')['data-theme']).to eq 'system'
  end

  describe 'a session with no end time, such as one from registering or from before expiry existed' do
    before do
      post('/users', params: { user: { first_name: 'New', last_name: 'User', user_name: 'newuser', email: 'new@example.test', password: 'secret' } }, xhr: false)
    end

    let(:user) { User.find_by!(user_name: 'newuser') }

    it 'stays signed in on its next request' do
      expect(signed_in?).to be true
    end

    it 'then ends a day after that request' do
      expect(signed_in?).to be true
      travel 25.hours

      expect(signed_in?).to be false
    end
  end

  describe 'registering in a browser that signed out earlier' do
    def register_after_an_earlier_sign_in(**remember)
      earlier = create_user
      post('/sessions', params: { username_email: earlier.email, password: 'secret', **remember })
      post("/sessions/#{earlier.id}", xhr: false)
      travel 2.days
      post('/users', params: { user: { first_name: 'Next', last_name: 'User', user_name: 'nextuser', email: 'next@example.test', password: 'secret' } }, xhr: false)
    end

    it "isn't ended by the end time the earlier sign-in left" do
      register_after_an_earlier_sign_in

      expect(get('/', xhr: false).body).to include 'Signed in as Next User'
    end

    it "doesn't inherit the earlier sign-in's Remember me" do
      register_after_an_earlier_sign_in(remember: 'true')

      expect(Time.httpdate(get('/', xhr: false)['set-cookie'][/expires=([^;]+)/i, 1])).to be_within(60).of(Time.now + 1.day)
    end
  end

  describe 'Remember me' do
    def sign_in(**extra) = post('/sessions', params: { username_email: user.email, password: 'secret', **extra })

    def cookie_expiry(response) = Time.httpdate(response['set-cookie'][/expires=([^;]+)/i, 1])

    it 'gives a remembered sign-in a cookie that lasts 30 days' do
      expect(cookie_expiry(sign_in(remember: 'true'))).to be_within(60).of(Time.now + 30.days)
    end

    it 'gives any other sign-in a cookie that lasts a day' do
      expect(cookie_expiry(sign_in)).to be_within(60).of(Time.now + 1.day)
    end

    it 'keeps a remembered session left unused for 29 days signed in, for 30 more days' do
      sign_in(remember: 'true')
      travel 29.days

      response = get('/', xhr: false)
      expect(response.body).to include "Signed in as #{user.full_name}"
      expect(cookie_expiry(response)).to be_within(60).of(Time.now + 30.days)
    end
  end

  describe 'the session cookie' do
    def sign_in(env = {}) = post('/sessions', params: { username_email: user.email, password: 'secret' }, env: env)

    def flags(response) = response['set-cookie'].split(/;\s*/).drop(1).map(&:downcase)

    it 'is HttpOnly, SameSite=Lax and Secure over HTTPS' do
      expect(flags(sign_in('HTTP_X_FORWARDED_PROTO' => 'https'))).to include('httponly', 'samesite=lax', 'secure')
    end

    it 'is not Secure over plain HTTP, and still signs in' do
      expect(flags(sign_in)).to include('httponly', 'samesite=lax')
      expect(flags(sign_in)).not_to include('secure')
      expect(get('/', xhr: false).body).to include "Signed in as #{user.full_name}"
    end

    it "isn't set on the API calls toddseller.com makes without one" do
      stub_request(:get, %r{\Ahttps://plex\.toddseller\.dev/api/v2\?})
        .to_return(body: { response: { data: [{ count: 1 }, { count: 2, child_count: 3 }] } }.to_json, headers: { 'Content-Type' => 'application/json' })

      expect(get('/api/year', xhr: false)['set-cookie']).to be_nil
      expect(get('/api/movies/count', xhr: false)['set-cookie']).to be_nil
    end
  end
end
