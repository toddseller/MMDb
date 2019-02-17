namespace '/api/v2' do

  before do
    content_type 'application/json'
  end

  get '/homepage' do
    topMovies = Movie.top_movies.first(10)
    recentMovies = Movie.recently_added.first(10)
    recentShows = Show.recently_added.first(10)
    {topMovies: topMovies, recentMovies: recentMovies, recentShows: recentShows}.to_json
  end
  # get '/top_movies' do
  #   Movie.top_movies.first(10).to_json
  # end
  #
  # get '/recent_movies' do
  #   Movie.recently_added.first(10).to_json
  # end
  #
  # get '/recent_shows' do
  #   Show.recently_added.first(10).to_json
  # end

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
      currentUser = {id: user.id, firstName: user.first_name, userName: user.user_name, theme: user.theme}
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

    user.movies.sorted_list.to_json( { include: :ratings } ).page(params[:page]).per_page(100)
  end

  get '/movies/:id' do
    authenticate!

    movie = Movie.find(params[:id])
    movie.to_json
  end

  put '/movies/:id' do
    authenticate!

    movie = Movie.find(params[:id])
    movie.update(params[:movie])
    movie.to_json
  end

  get '/add_movies' do
    authenticate!

    title = params[:query].downcase
    movie_previews = Movie.get_titles(title)

    movie_previews.to_json
  end

  get '/shows' do
    authenticate!

    user = User.find(@auth_payload['sub'])
    user.shows.sorted_list.to_json( { include: [ seasons: { include: :episodes } ] } )
  end

  def authenticate!
    supplied_token = String(request.env['HTTP_AUTHORIZATION']).slice(7..-1)

    @auth_payload, @auth_header = JwtAuth.decode(supplied_token)

  rescue JWT::DecodeError => e
    halt 401, json(message: e.message)
  end

end
