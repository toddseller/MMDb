describe 'pages with hostile text' do
  let(:user) { create_user }

  def page_of(response)
    body = JSON.parse(response.body)
    Nokogiri::HTML(body.is_a?(Hash) ? body['page'] : body)
  end

  def movie_with(**attributes)
    create_movie(user).tap { |movie| movie.update!({ actors: '', producer: '', writer: '', studio: '', file_name: '' }.merge(attributes)) }
  end

  it 'keeps a script in a show title from becoming an element' do
    create_show(user, title: '<script>window.__xss = true</script>')
    page = page_of(get("/users/#{user.id}/shows"))
    expect(page.css('script')).to be_empty
    expect(page.text).to include('<script>window.__xss = true</script>')
  end

  it 'keeps markup in a movie plot from becoming an element' do
    movie = movie_with(plot: '<img src=x onerror=alert(1)>')
    page = page_of(get("/users/#{user.id}/movies/#{movie.id}"))
    expect(page.css('img[src="x"]')).to be_empty
  end

  it 'keeps a title from adding attributes to its poster' do
    movie = movie_with(title: 'x onerror=alert(1)')
    page = page_of(get("/users/#{user.id}/movies/#{movie.id}"))
    expect(page.css('img[onerror]')).to be_empty
    expect(page.css('img').map { |img| img['alt'] }).to include('x onerror=alert(1) Poster')
  end

  ['"', "'"].each do |quote|
    it "keeps a #{quote} in a poster URL from adding attributes" do
      show = create_show(user)
      show.update!(poster: "https://img.example.test/a.jpg#{quote} onload=#{quote}alert(1)")
      page = page_of(get("/users/#{user.id}/shows"))
      expect(page.css('img[onload]')).to be_empty
    end
  end

  it 'escapes the shows grid returned after adding episodes' do
    show = create_show(user, title: '<script>window.__xss = true</script>')
    log_in(user, 'secret-password')
    response = post("/users/#{user.id}/shows/#{show.id}/seasons/#{show.seasons.first.id}/episodes", params: { episode: { title: 'Second', tv_episode: '2' } })
    expect(page_of(response).css('script')).to be_empty
  end
end
