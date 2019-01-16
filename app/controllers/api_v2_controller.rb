namespace '/api/v2' do

  before do
    content_type 'application/json'
  end

  post '/authenticate' do
    user = User.find_by(email: params[:username_email]) || User.find_by(user_name: params[:username_email])
    if user && user.authenticate(params[:password])
      session[:user_id] = user.id
      {message: "You've logged in. Yay you!!", token: JwtAuth.token(user)}.to_json
    else
      halt 404
    end
  end

  get '/movies' do
    authenticate!

    user = @auth_payload['user']
    # valid_user = User.find_by(user_name: user['username'])

    # valid_user.movies.sorted_list.to_json
    current_user.movies.sorted_list.to_json
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

  def authenticate!
    supplied_token = String(request.env['HTTP_AUTHORIZATION']).slice(7..-1)

    @auth_payload, @auth_header = JwtAuth.decode(supplied_token)

  rescue JWT::DecodeError => e
    halt 401, json(message: e.message)
  end

end
