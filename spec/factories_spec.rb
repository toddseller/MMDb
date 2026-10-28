describe 'test factories' do
  it 'creates users with unique names who can log in' do
    first = create_user
    second = create_user
    expect([first.user_name, first.email]).not_to include(second.user_name, second.email)
    expect(JSON.parse(log_in(second, 'secret-password').body)['status']).to eq 'true'
  end

  it 'creates a show for a user with the given seasons, one episode each' do
    user = create_user
    show = create_show(user, seasons: [1, 3])
    expect(user.shows).to include show
    expect(show.seasons.map(&:season)).to eq [1, 3]
    expect(show.seasons.map { |season| season.episodes.count }).to eq [1, 1]
  end

  it 'creates a movie for a user' do
    user = create_user
    expect(user.movies).to include create_movie(user)
  end
end
