describe 'test settings' do
  # A plain eq would print the actual value on failure, and locally that is a real secret.
  def expect_test_value(name, value)
    expect(ENV[name] == value).to be(true), "#{name} is not set to its test value"
  end

  it 'uses fixed test values even when .env holds real ones' do
    expect_test_value('JWT_SECRET', 'test-jwt-secret')
    expect_test_value('SESSION_SECRET', 'test-session-secret-at-least-64-bytes-long-as-rack-session-requires')
    expect_test_value('TAUTULLI_KEY', 'test-tautulli-key')
  end

  it 'signs and verifies API tokens with the test secret' do
    user = create_user
    payload, = JwtAuth.decode(JwtAuth.token(user, lifetime: JwtAuth::SESSION_LIFETIME))
    expect(payload['sub']).to eq user.id
  end
end
