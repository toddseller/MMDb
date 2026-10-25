describe 'Collection access' do
  let(:owner) { create_user }
  let(:other) { create_user }
  let!(:movie) { create_movie(owner) }
  let!(:show) { create_show(owner) }
  let(:season) { show.seasons.find_by!(season: 1) }
  let(:episode) { season.episodes.first }

  before { allow(Show).to receive(:get_episodes).and_return([]) }

  # Everything a refused write could touch, so "changes nothing" is one comparison.
  def state
    [Movie.order(:id).pluck(:id, :plot, :updated_at), Show.order(:id).pluck(:id, :title, :poster, :updated_at),
     Season.order(:id).pluck(:id, :is_active, :poster), Episode.order(:id).pluck(:id, :title),
     owner.movies.reload.ids, owner.shows.reload.ids, Rating.count, User.order(:id).pluck(:id, :first_name, :theme)]
  end

  def expect_refused(status, method, path, params = {})
    before = state
    expect(request(method, path, params: params).status).to eq status
    expect(state).to eq before
  end

  it 'treats a session naming a deleted user as signed out' do
    gone = create_user
    log_in(gone, 'secret')
    gone.destroy

    expect(post("/users/#{owner.id}/shows/#{show.id}/artwork").status).to eq 401
  end

  it 'has no route for deleting a show' do
    log_in(owner, 'secret')

    expect_refused(404, 'DELETE', "/users/#{owner.id}/shows/#{movie.id}")
  end

  # Routes on a collection: [method, path for a user id, params]. Those on an existing record come first.
  owner_routes = {
    'editing a movie' => ->(uid) { ['PUT', "/users/#{uid}/movies/#{movie.id}", { movie: { title: movie.title, rating: 'pg', plot: 'changed' } }] },
    'removing a movie' => ->(uid) { ['DELETE', "/users/#{uid}/movies/#{movie.id}"] },
    'editing a show' => ->(uid) { ['PUT', "/users/#{uid}/shows/#{show.id}", { show: { title: 'Changed', poster: '' }, season: { poster: '' }, episode: { title: 'Changed' }, form: { id: episode.id.to_s } }] },
    'uploading show artwork' => ->(uid) { ['POST', "/users/#{uid}/shows/#{show.id}/artwork"] },
    'setting the default season' => ->(uid) { ['POST', "/users/#{uid}/shows/#{show.id}/seasons/2"] },
    'adding an episode' => ->(uid) { ['POST', "/users/#{uid}/shows/#{show.id}/seasons/#{season.id}/episodes", { episode: { title: 'Extra', tv_episode: '2' } }] },
    'deleting an episode' => ->(uid) { ['DELETE', "/users/#{uid}/shows/#{show.id}/seasons/#{season.id}/episodes/#{episode.id}"] },
    'adding a movie' => ->(uid) { ['POST', "/users/#{uid}/movies", { movie: { title: 'New Movie', year: '2020', director: 'Jane Doe' } }] },
    'adding a season' => ->(uid) { ['POST', "/users/#{uid}/shows", { show: { show_collection_id: 'new-1', title: 'New Show' }, season: { collectionId: 'new-1-s1', season: '1' } }] }
  }
  on_a_record = owner_routes.keys.first(7)

  owner_routes.each do |name, route|
    describe name do
      it 'is refused with 401 when nobody is signed in' do
        expect_refused(401, *instance_exec(owner.id, &route))
      end

      it "is refused with 403 for another user on the owner's URL" do
        log_in(other, 'secret')

        expect_refused(403, *instance_exec(owner.id, &route))
      end

      next unless on_a_record.include?(name)

      it "is refused with 403 on the user's own URL for a record outside their collection" do
        log_in(other, 'secret')

        expect_refused(403, *instance_exec(other.id, &route))
      end
    end
  end

  describe 'routes without a user in the URL' do
    let(:refresh) { ['PUT', "/movies/update/#{movie.id}", { movie: { title: movie.title, rating: 'pg', plot: 'changed' } }] }
    let(:show_form) { ['POST', '/shows', { show: { show_collection_id: 'new-2', title: 'New Show' }, season: { collectionId: 'new-2-s1', season: '1', poster: '' } }] }
    let(:rating) { ['POST', "/movies/#{movie.id}/ratings", { rating: '4' }] }
    let(:account) { ['PUT', "/users/#{owner.id}", { first_name: 'Changed', last_name: 'Test', user_name: owner.user_name, email: owner.email, current: '' }] }

    { 'refreshing a movie' => :refresh, 'creating a show' => :show_form, 'rating a movie' => :rating, 'saving Account Settings' => :account }.each do |name, route|
      it "refuses #{name} with 401 when nobody is signed in" do
        expect_refused(401, *send(route))
      end
    end

    it "refuses refreshing a movie outside the signed-in user's collection with 403" do
      log_in(other, 'secret')

      expect_refused(403, *refresh)
    end

    it "refuses saving another user's Account Settings with 403" do
      log_in(other, 'secret')

      expect_refused(403, *account)
    end

    it "saves a signed-in user's rating of another collection's movie" do
      log_in(other, 'secret')

      expect { post("/movies/#{movie.id}/ratings", params: { rating: '4' }) }.to change { movie.ratings.where(user_id: other.id, stars: 4).count }.by(1)
    end
  end

  describe 'searches' do
    include MovieSearchStubs

    before do
      stub_movie_sources_empty
      stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/(tv|person)\?}).to_return(json(results: []))
    end

    searches = {
      'the Add Movie search' => ['/movies', { query: 'rocky' }],
      "the edit form's search" => ['/movies/update', { title: 'rocky', route: '/movies/1' }],
      'the Add TV Show search' => ['/shows', { query: 'lupin' }]
    }

    searches.each do |name, (path, params)|
      it "refuses #{name} with 401 when nobody is signed in, without asking Apple or TMDB" do
        expect(get(path, params: params).status).to eq 401
        expect(search_requests(%r{uts-api\.itunes\.apple\.com|api\.themoviedb\.org})).to eq 0
      end

      it "answers #{name} for a signed-in user" do
        log_in(owner, 'secret')

        expect(get(path, params: params).status).to eq 200
      end
    end

    it 'answers the person filter for a visitor' do
      expect(get('/movies/search', params: { filter: 'Jane Doe', id: owner.id }).status).to eq 200
    end

    it "shows a collection's movies to a visitor" do
      response = get("/users/#{owner.id}/movies", xhr: false)

      expect(response.status).to eq 200
      expect(response.body).to include movie.title
    end
  end
end
