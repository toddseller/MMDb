describe 'movie grids' do
  APPLE_POSTER = 'https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/ab/cd/x.jpg/2000x3000.jpg'

  let(:user) { create_user }

  # update_column skips Movie's before_update callbacks, which rewrite poster URLs.
  def apple_movie(**attributes)
    create_movie(user).tap { |movie| movie.update_columns(poster: APPLE_POSTER, **attributes) }
  end

  def posters(html) = Nokogiri::HTML(html).css('a.movie-modal img, .top-preview img')

  def expect_lazy_thumbnails(images)
    expect(images).not_to be_empty
    expect(images.map { |img| img['loading'] }).to all eq 'lazy'
    expect(images.map { |img| img['src'] }).to all end_with '/348x522bb.jpg'
    expect(images.map { |img| img['data-original'] }).to all be_nil
  end

  it 'loads the movies page posters lazily at tile size' do
    apple_movie
    expect_lazy_thumbnails(posters(get("/users/#{user.id}", xhr: false).body))
  end

  it 'loads the movies grid re-rendered by the movies link lazily at tile size' do
    apple_movie
    expect_lazy_thumbnails(posters(JSON.parse(get("/users/#{user.id}").body)['page']))
  end

  it 'loads the unwatched list lazily at tile size' do
    apple_movie(isnew: true)
    expect_lazy_thumbnails(posters(get("/movies/new/#{user.id}").body))
  end

  it 'loads a title search lazily at tile size' do
    movie = apple_movie
    expect_lazy_thumbnails(posters(JSON.parse(get('/movies/filter', params: { id: user.id, filter: movie.title }).body)['page']))
  end

  it 'loads the home page top and recent movies lazily at tile size' do
    apple_movie
    expect_lazy_thumbnails(posters(get('/', xhr: false).body))
  end
end
