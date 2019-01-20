use Rack::Cors do |config|
  config.allow do |allow|

    allow.origins 'localhost:8080'
    allow.resource '/api/v2/authenticate',
                   :methods => [:post],
                   :headers => :any,
                   :max_age => 0
  end
end

namespace '/api/v2' do

  before do
    content_type 'application/json'
  end

  get '/top_movies' do
    Movie.top_movies.first(10).to_json
  end

  get '/recent_movies' do
    Movie.recently_added.first(10).to_json
  end

  get '/recent_shows' do
    Show.recently_added.first(10).to_json
  end

  post '/authenticate' do
    user = User.find_by(email: params[:username_email]) || User.find_by(user_name: params[:username_email])
    if user && user.authenticate(params[:password])
      session[:user_id] = user.id
      {token: JwtAuth.token(user)}.to_json
    else
      session[:user_id] = nil
      halt 404, json("Invalid login. Please check your credentials and try again.")
    end
  end

  post '/deauthenticate' do
    session[:user_id] = nil
  end

  get '/movies' do
    authenticate!

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
