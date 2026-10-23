describe 'the app' do
  it 'serves the homepage' do
    expect(get('/', xhr: false).status).to eq 200
  end

  it 'logs in and keeps the session cookie' do
    user = create_user
    expect(JSON.parse(log_in(user, 'secret').body)['status']).to eq 'true'
    expect(@cookie).to start_with 'rack.session='
  end
end
