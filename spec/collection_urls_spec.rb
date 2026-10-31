describe 'collection addresses' do
  let(:user) { create_user.tap { |user| user.update!(handle: 'todd-seller') } }

  before do
    create_movie(user, title: 'Amber')
    create_show(user, title: 'Harbor Lights')
  end

  it 'shows the movies at the handle' do
    response = get('/u/todd-seller', xhr: false)

    expect(response.status).to eq 200
    expect(response.body).to include('id="movie-list"', 'Amber Poster')
  end

  it 'shows the TV shows at the handle' do
    response = get('/u/todd-seller/shows', xhr: false)

    expect(response.status).to eq 200
    expect(response.body).to include('id="show-list"', 'Harbor Lights Poster')
  end

  it 'answers the page’s own requests at the handle as at the id' do
    expect(get('/u/todd-seller').body).to eq get("/users/#{user.id}").body
    expect(get('/u/todd-seller/shows').body).to eq get("/users/#{user.id}/shows").body
  end

  it 'answers 404 for an unknown handle' do
    expect(get('/u/nobody-here', xhr: false).status).to eq 404
    expect(get('/u/nobody-here/shows', xhr: false).status).to eq 404
  end

  it 'redirects an old handle to the current one' do
    user.update!(handle: 'todd')

    expect(get('/u/todd-seller', xhr: false)).to have_attributes(status: 301, location: '/u/todd')
    expect(get('/u/todd-seller/shows', xhr: false)).to have_attributes(status: 301, location: '/u/todd/shows')
  end

  it 'redirects a numeric address opened as a page to the handle, keeping the query' do
    expect(get("/users/#{user.id}", xhr: false)).to have_attributes(status: 301, location: '/u/todd-seller')
    expect(get("/users/#{user.id}/shows?letter=h", xhr: false)).to have_attributes(status: 301, location: '/u/todd-seller/shows?letter=h')
  end

  it 'answers the page’s own requests to a numeric address without a redirect' do
    response = get("/users/#{user.id}")

    expect(response.status).to eq 200
    expect(JSON.parse(response.body)).to include('status' => 'true', 'movie_count' => '1')
  end

  # The test environment raises what production answers with its plain 500 page.
  it 'still treats a numeric address with no such user as an error' do
    expect { get('/users/999999999', xhr: false) }.to raise_error(ActiveRecord::RecordNotFound)
  end
end

describe 'links to a collection' do
  def page(path) = Nokogiri::HTML(get(path, xhr: false).body)

  let(:owner) { create_user.tap { |user| user.update!(handle: 'todd-seller') } }

  it 'use the handle in the home page’s list' do
    10.times { create_movie(owner) }

    expect(page('/').css('a.index-user').map { |link| link['href'] }).to include('/u/todd-seller')
  end

  it 'use the handle in the menu' do
    log_in(owner, 'secret-password')

    menu = page('/')
    expect(menu.at_css('#drop-down-submenu #user-movies')['href']).to eq '/u/todd-seller'
    expect(menu.at_css('#drop-down-submenu #user-shows')['href']).to eq '/u/todd-seller/shows'
  end

  it 'use the handle on the button to another user’s other collection' do
    create_movie(owner)
    create_show(owner)
    log_in(create_user, 'secret-password')

    expect(page('/u/todd-seller').at_css('#search-boxes #user-shows')['href']).to eq '/u/todd-seller/shows'
    expect(page('/u/todd-seller/shows').at_css('#search-boxes #user-movies')['href']).to eq '/u/todd-seller'
  end
end

describe 'signing in' do
  it 'answers with the collection’s handle' do
    user = create_user.tap { |user| user.update!(handle: 'todd-seller') }

    response = post('/sessions', params: { username_email: user.email, password: 'secret-password' })

    expect(JSON.parse(response.body)).to include('status' => 'true', 'handle' => 'todd-seller')
  end
end
