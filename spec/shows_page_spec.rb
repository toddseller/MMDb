describe 'GET /users/:user_id/shows' do
  def user_with_shows(count)
    user = create_user
    count.times { create_show(user) }
    user
  end

  def page_for(user)
    Nokogiri::HTML(JSON.parse(get("/users/#{user.id}/shows").body)['page'])
  end

  it 'issues the same number of queries for 2 shows as for 10' do
    small = user_with_shows(2)
    large = user_with_shows(10)
    expect(queries { get("/users/#{large.id}/shows") }.size).to eq queries { get("/users/#{small.id}/shows") }.size
  end

  it 'reads no episode rows' do
    user = user_with_shows(2)
    expect(queries { get("/users/#{user.id}/shows") }.grep(/SELECT "episodes"\.\*/)).to be_empty
  end

  it 'reads no movie rows' do
    user = user_with_shows(2)
    create_movie(user)
    expect(queries { get("/users/#{user.id}/shows") }.grep(/SELECT "movies"\.\*/)).to be_empty
  end

  it 'labels each tile with its seasons as before' do
    user = create_user
    create_show(user, title: 'One', seasons: [2])
    create_show(user, title: 'Two', seasons: [1, 3])
    create_show(user, title: 'Three', seasons: [1, 2, 3])
    create_show(user, title: 'Seven', seasons: (1..7).to_a)

    labels = page_for(user).css('.index-preview-show').to_h do |tile|
      [tile.at_css('.show-truncate').text, tile.at_css('.season').text.squish]
    end
    expect(labels).to eq('One' => 'Season 2', 'Seven' => '7 seasons', 'Three' => 'Seasons 1–3', 'Two' => 'Seasons 1, 3')
  end

  it 'loads grid posters lazily at thumbnail size' do
    user = user_with_shows(2)
    images = page_for(user).css('#show-list img')
    expect(images.size).to eq 2
    expect(images.map { |img| img['loading'] }).to all eq 'lazy'
    expect(images.map { |img| img['src'] }).to all end_with '/400x400.jpg'
  end

  it 'shows a visitor the Movies link when the owner has a movie' do
    owner = user_with_shows(1)
    create_movie(owner)
    expect(page_for(owner).at_css('#user-movies')).not_to be_nil
  end
end
