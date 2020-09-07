namespace '/api/v2' do

  before do
    content_type 'application/json'
  end

  get '/homepage' do
    topMovies = []
    recentMovies = []
    recentShows = []
    Movie.top_movies.first(10).each { |m| topMovies << {id: m.id, poster: m.poster} }
    Movie.recently_added.first(10).each { |m| recentMovies << {id: m.id, poster: m.poster} }
    Show.recently_added.first(10).each { |s| recentShows << {id: s.id, poster: s.poster} }
    year = Time.now.year
    {topMovies: topMovies, recentMovies: recentMovies, recentShows: recentShows, year: year, topUsers: User.top_users}.to_json
  end

  post '/signup' do
    user = User.create(params)
    if user.valid?
      session[:user_id] = user.id
      status 201
      {token: JwtAuth.token(user)}.to_json
    else
      session[:user_id] = nil
      halt 422, json(errorMessage: user.errors.full_messages)
    end
  end

  post '/authenticate' do
    user = User.find_by(email: params[:username_email]) || User.find_by(user_name: params[:username_email])
    if user && user.authenticate(params[:password])
      currentUser = {id: user.id, firstName: user.first_name, userName: user.user_name, avatar: user.avatar}
      session[:user_id] = user.id
      {token: JwtAuth.token(user), user: currentUser}.to_json
    else
      session[:user_id] = nil
      halt 401, json(errorMessage: "Invalid login. Please check your credentials and try again.")
    end
  end

  post '/deauthenticate' do
    session[:user_id] = nil
  end

  get '/movies' do
    authenticate!

    user = User.find(@auth_payload['sub'])
    # user.movies.sorted_list.to_json( { include: :ratings } )
    Movie.basic_info(user).to_json
  end

  get '/movies_details' do
    authenticate!

    user = User.find(@auth_payload['sub'])
    user.movies.sorted_list.to_json({include: :ratings})
  end

  get '/movies/:id' do
    authenticate!

    movie = Movie.find(params[:id])
    movie.to_json({include: :ratings})
  end

  put '/movies/:id' do
    authenticate!

    movie = Movie.find(params[:id])
    movie.update(params[:movie])
    movie.to_json
  end

  get '/add_movie' do
    authenticate!

    title = params[:query].downcase
    movie_previews = Movie.get_titles(title)

    movie_previews.to_json
  end

  post '/add_movie' do
    authenticate!

    user = User.find(@auth_payload['sub'])
    movie = Movie.find_by("title = ? AND year = ?", params[:movie]['title'], params[:movie]['year']) || Movie.new(params[:movie])
    if movie.save
      movie.users << user if !movie.users.include?(user)
      movie.save
    end
    movie.to_json({include: :ratings})
  end

  get '/shows' do
    authenticate!

    user = User.find(@auth_payload['sub'])
    Show.basic_info(user).to_json
  end

  get '/shows/:id' do
    authenticate!

    show = Show.find(params[:id])
    show.to_json({include: [seasons: {include: :episodes}]})
  end

  get '/add_show' do
    authenticate!

    title = params[:query].downcase
    show_previews = Show.get_series(title)

    show_previews.to_json
  end

  post '/add_show' do
    authenticate!

    user = User.find(@auth_payload['sub'])
    p params
    show = Show.find_by("title = ?", params[:show]['title']) || Show.new(title: params[:show]['title'], year: params[:show]['year'], rating: params[:show]['rating'], genre: params[:show]['genre'], poster: params[:season]['poster'])
    season = Season.find_by(collectionId: params[:season]['collectionId']) || show.seasons.new(params[:season])

    if show.save
      show.users << user if !show.users.include?(user)
      if season.save
        season.update(count: params[:season]['count'])
        season.update(storeId: params[:season]['storeId']) if season[:storeId] == nil && params[:season]['storeId'] != nil
        if show.seasons.length == 1
          season.update(is_active: true)
        end
        episodes_previews = !season.skip.to_s.strip.empty? ? Show.get_episodes(season.appleTvId, season.season, season.skip, season.count, season.storeId) : Show.get_episodes(season.collectionId, season.season)
      end
    end
    episodes_previews.to_json
  end

  get '/counts' do
    authenticate!

    user = User.find(@auth_payload['sub'])
    movies_count = user.movies.count
    shows_count = user.shows.count
    episodes_count = Episode.episode_count(user.id)
    {moviesCount: movies_count, showsCount: shows_count, episodesCount: episodes_count}.to_json
  end


  def authenticate!
    supplied_token = String(request.env['HTTP_AUTHORIZATION']).slice(7..-1)

    @auth_payload, @auth_header = JwtAuth.decode(supplied_token)

  rescue JWT::DecodeError => e
    halt 401, json(message: e.message)
  end

end
