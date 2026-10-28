%w[v2 v3].each do |version|
  describe "/api/#{version} owner checks" do
    let(:owner) { create_user }
    let(:other) { create_user }
    let(:api) { "/api/#{version}" }

    def as(user)
      { 'HTTP_AUTHORIZATION' => "bearer #{JwtAuth.token(user, lifetime: JwtAuth::SESSION_LIFETIME)}" }
    end

    describe 'editing a movie' do
      let(:movie) { create_movie(owner, title: 'Original') }

      def edit(env)
        request('PUT', "#{api}/movies/#{movie.id}", json: { movie: { title: 'Changed' } }, env: env)
      end

      it 'refuses a movie that is not in the collection' do
        expect(edit(as(other)).status).to eq 403
        expect(movie.reload.title).to eq 'Original'
      end

      it 'refuses a request without a token' do
        expect(edit({}).status).to eq 401
        expect(movie.reload.title).to eq 'Original'
      end

      it "saves the owner's edit" do
        expect(edit(as(owner)).status).to eq 200
        expect(movie.reload.title).to eq 'Changed'
      end

      if version == 'v3'
        it 'refuses a PATCH for a movie that is not in the collection' do
          expect(request('PATCH', "#{api}/movies/#{movie.id}", json: { title: 'Changed', sortName: 'changed' }, env: as(other)).status).to eq 403
        end
      end
    end

    describe 'adding episodes' do
      let(:show) { create_show(owner, seasons: [1]) }
      let(:season) { show.seasons.first }

      def episode(number, show_id: show.id, season_id: season.id)
        { show_id: show_id, season_id: season_id, tv_episode: number, title: "Episode #{number}" }
      end

      def add(episode, env)
        post("#{api}/add_episodes", json: { episode: episode }, env: env)
      end

      it 'refuses a show that is not in the collection' do
        expect(add(episode(2), as(other)).status).to eq 403
        expect(season.episodes.count).to eq 1
      end

      it 'refuses a list of episodes for a show that is not in the collection' do
        expect(add([episode(2), episode(3)], as(other)).status).to eq 403
        expect(season.episodes.count).to eq 1
      end

      it "adds the owner's episode" do
        add(episode(2), as(owner))
        expect(season.episodes.count).to eq 2
      end

      it 'adds episodes to a show the user has just added, as MyFlix does' do
        added = post("#{api}/add_show", json: { show: { title: 'New Show', show_collection_id: 'new-show', collectionId: 'new-show-1', season: 1 } }, env: as(other))
        new_season = Season.find_by(collectionId: 'new-show-1')
        add(episode(1, show_id: JSON.parse(added.body)['id'], season_id: new_season.id), as(other))
        expect(new_season.episodes.count).to eq 1
      end
    end
  end
end
