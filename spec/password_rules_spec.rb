require 'open3'

describe 'password rules' do
  def register(password, user_name: 'newcomer')
    post('/users', params: { user: { first_name: 'New', last_name: 'User', user_name: user_name, email: "#{user_name}@example.test", password: password } }, xhr: false)
  end

  def signs_in?(email, password)
    JSON.parse(post('/sessions', params: { username_email: email, password: password }).body)['status'] == 'true'
  end

  it 'refuses an empty password at registration' do
    response = register('')
    expect(User.find_by(user_name: 'newcomer')).to be_nil
    expect(CGI.unescape(response['location'])).to include 'Password must be at least 8 characters'
  end

  it 'refuses a 7-character new password in Account Settings' do
    user = create_user
    log_in(user, 'secret-password')
    response = request('PUT', "/users/#{user.id}", params: { first_name: 'Ann', last_name: 'Lee', user_name: user.user_name, email: user.email, theme: 'system', current: 'secret-password', password: 'seven77' })

    expect(JSON.parse(response.body)['status']).to eq 'false'
    expect(signs_in?(user.email, 'secret-password')).to be true
  end

  it 'refuses a 73-byte password at API signup' do
    response = post('/api/v3/signup', json: { first_name: 'New', last_name: 'User', user_name: 'apiuser', email: 'apiuser@example.test', password: 'x' * 73 })

    expect(response.status).to eq 422
    expect(JSON.parse(response.body)['errorMessage']).to include 'Password must be at most 72 bytes'
    expect(User.find_by(user_name: 'apiuser')).to be_nil
  end

  { 'an 8-character' => 'x' * 8, 'a 72-byte' => 'é' * 36 }.each do |description, password|
    it "accepts #{description} password" do
      register(password)
      expect(signs_in?('newcomer@example.test', password)).to be true
    end
  end

  # bcrypt's default cost makes every hash take about 0.2 s; tests hash at the minimum, the app must not.
  it 'hashes test users at the minimum cost' do
    expect(BCrypt::Password.new(create_user.password_hash).cost).to eq BCrypt::Engine::MIN_COST
  end

  it 'leaves the app outside the tests at the default cost' do
    env = { 'RACK_ENV' => 'production', 'DATABASE_URL' => 'postgres://localhost/MMDb_test', 'SESSION_SECRET' => 'x' * 64, 'JWT_SECRET' => 'x' }
    cost, status = Open3.capture2(env, 'ruby', '-e', 'require "./config/environment"; print BCrypt::Engine.cost', chdir: APP_ROOT.to_s)

    expect(status).to be_success
    expect(cost.to_i).to eq BCrypt::Engine::DEFAULT_COST
  end
end
