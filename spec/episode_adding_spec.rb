describe 'adding an episode the season already has' do
  let(:user) { create_user }
  let(:show) { create_show(user, seasons: [1]) }
  let(:season) { show.seasons.first }
  let(:stored) { season.episodes.first.tap { |e| e.update!(title: 'Hand edit') } }

  before { stored }

  def incoming(number = 1)
    { title: 'Incoming', tv_episode: number.to_s, plot: 'Incoming plot', runtime: '42' }
  end

  def expect_filled
    expect([stored.reload.title, stored.plot, stored.runtime]).to eq ['Hand edit', 'Incoming plot', '42 min']
    expect(season.episodes.where(tv_episode: 1).count).to eq 1
  end

  describe 'from the search panel' do
    before { log_in(user, 'secret-password') }

    let(:path) { "/users/#{user.id}/shows/#{show.id}/seasons/#{season.id}/episodes" }

    it 'fills one episode' do
      post(path, params: { episode: incoming })
      expect_filled
    end

    it 'fills it within Add All Episodes' do
      post(path, params: { episodes: [incoming(1), incoming(2)] })
      expect_filled
      expect(season.episodes.count).to eq 2
    end
  end

  it 'fills it from Create New Show' do
    log_in(user, 'secret-password')
    show.update!(show_collection_id: "collection-#{show.id}")
    season.update!(collectionId: "season-#{season.id}")

    post('/shows', params: {
      new: 'true',
      show: { show_collection_id: show.show_collection_id, title: show.title },
      season: { collectionId: season.collectionId, season: '1' },
      episode: incoming
    })

    expect_filled
  end

  %w[v2 v3].each do |version|
    describe "through API #{version}" do
      let(:env) { { 'HTTP_AUTHORIZATION' => "bearer #{JwtAuth.token(user, lifetime: JwtAuth::SESSION_LIFETIME)}" } }

      let(:api) { "/api/#{version}" }

      def add(episode)
        post("#{api}/add_episodes", json: { episode: episode }, env: env)
      end

      def with_ids(episode) = episode.merge(show_id: show.id, season_id: season.id)

      it 'fills one episode and lists it once' do
        response = add(with_ids(incoming))

        expect_filled
        listed = JSON.parse(response.body)['seasons'].first['episodes'].select { |e| e['tv_episode'] == 1 }
        expect(listed.map { |e| e['runtime'] }).to eq ['42 min']
      end

      it 'fills it within a list of episodes' do
        add([with_ids(incoming(1)), with_ids(incoming(2))])

        expect_filled
        expect(season.episodes.count).to eq 2
      end
    end
  end
end
