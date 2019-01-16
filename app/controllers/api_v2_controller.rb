namespace '/api/v2' do
  # use JwtAuth
  before do
    content_type 'application/json'
  end

  post '/authenticate' do
    user = User.find_by(email: params[:username_email]) || User.find_by(user_name: params[:username_email])
    if user && user.authenticate(params[:password])
      {message: "You've logged in. Yay you!!", token: JwtAuth.token(user)}.to_json
    else
      halt 404
    end
  end

  get '/movies' do
    authenticate!

    user = @auth_payload['user']
    valid_user = User.find_by(user_name: user['username'])

    # if valid_user
      valid_user.movies.sorted_list.to_json
    # else
    #   halt 403
    # end
  end
  # def token u
  #   JWT.encode payload(u), ENV['JWT_SECRET'], 'HS256'
  # end

  # def payload u
  #   {
  #       exp: Time.now.to_i + 60 * 1440,
  #       iat: Time.now.to_i,
  #       iss: ENV['JWT_ISSUER'],
  #       user: {
  #           username: u.user_name,
  #           fullname: u.full_name
  #       }
  #   }
  # end
  def authenticate!
    # Extract <token> from the 'Bearer <token>' value of the Authorization header
    supplied_token = String(request.env['HTTP_AUTHORIZATION']).slice(7..-1)

    @auth_payload, @auth_header = JwtAuth.decode(supplied_token)

  rescue JWT::DecodeError => e
    halt 401, json(error: e, message: e.message)
  end
end