describe 'show edit responses' do
  let(:user) { create_user }
  let(:show) { create_show(user).tap { |s| s.seasons.first.update!(is_active: true) } }
  let(:season) { show.seasons.first }
  let(:episode) { season.episodes.first }
  let(:new_poster) { 'https://is1-ssl.mzstatic.com/image/thumb/new-art/600x600.jpg' }

  before { log_in(user, 'secret') }

  # Another user's episodes, so a count of every user's episodes is told apart from this user's.
  def someone_elses_episodes
    create_show(create_user, seasons: [1, 2, 3, 4])
  end

  def page_of(response)
    Nokogiri::HTML(JSON.parse(response.body)['page'])
  end

  it 'answers a save with the details and the show’s grid thumbnail' do
    response = request('PUT', "/users/#{user.id}/shows/#{show.id}", params: {
      show: { title: show.title, poster: new_poster }, season: { poster: new_poster },
      episode: { title: episode.title }, form: { id: episode.id.to_s }
    })

    body = JSON.parse(response.body)
    expect(body['poster']).to eq new_poster.sub('600x600', '400x400')
    expect(Nokogiri::HTML(body['page']).at_css('.description-poster img')['src']).to eq new_poster
  end

  it 'answers a default season with the show’s grid thumbnail' do
    season.update!(poster: new_poster)

    response = post("/users/#{user.id}/shows/#{show.id}/seasons/#{season.season}")

    expect(JSON.parse(response.body)['poster']).to eq new_poster.sub('600x600', '400x400')
  end

  it 'counts only the user’s episodes after adding one' do
    someone_elses_episodes

    response = post("/users/#{user.id}/shows/#{show.id}/seasons/#{season.id}/episodes", params: { episode: { title: 'Extra', tv_episode: '2' } })

    expect(JSON.parse(response.body)['episode_count']).to eq '4'
  end

  it 'counts only the user’s episodes after deleting one' do
    season.episodes.create!(title: 'Second', tv_episode: 2)
    someone_elses_episodes

    response = request('DELETE', "/users/#{user.id}/shows/#{show.id}/seasons/#{season.id}/episodes/#{episode.id}")

    expect(JSON.parse(response.body)['episode_count']).to eq '3'
  end

  it 'offers the panel’s Create New Show for a season with no episodes' do
    allow(Show).to receive(:get_episodes).and_return([])

    response = post("/users/#{user.id}/shows", params: {
      show: { show_collection_id: 'empty-1', title: 'Empty' }, season: { collectionId: 'empty-season-1', season: '1' }
    })

    button = page_of(response).at_css('#create-new')
    expect(button&.[]('type')).to eq 'button'
    expect(page_of(response).css('#create-show').map(&:name)).to all eq 'form'
  end

  it 'gives the edit dialog a hidden error line' do
    line = Nokogiri::HTML(JSON.parse(get("/users/#{user.id}/shows/#{show.id}/edit").body)).at_css('.modal-footer .edit-error')

    expect([line&.[]('role'), line&.key?('hidden')]).to eq ['alert', true]
  end

  it 'gives Create New Show a hidden error line' do
    line = page_of(get('/shows/new')).at_css('.modal-footer .edit-error')

    expect([line&.[]('role'), line&.key?('hidden')]).to eq ['alert', true]
  end
end
