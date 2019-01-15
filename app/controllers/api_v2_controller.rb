namespace '/api/v2' do
  # use JwtAuth
  before do
    content_type 'application/json'
  end

  post '/authenticate' do
    user = User.find_by(email: params[:username_email]) || User.find_by(user_name: params[:username_email])
    if user && user.authenticate(params[:password])
      {message: "You've logged in. Yay you!!", token: token(user)}.to_json
    else
      halt 404
    end
  end

  get '/movies' do
      options = { algorithm: 'HS256', iss: ENV['JWT_ISSUER'] }
      bearer = env.fetch('HTTP_AUTHORIZATION', '').slice(7..-1)
      payload, header = JWT.decode bearer, ENV['JWT_SECRET'], true, options

      # env[:scopes] = payload['scopes']
      # @valid_user = payload['user']

    # rescue JWT::DecodeError
    #   [401, { 'Content-Type' => 'text/plain' }, ['A token must be passed.']]
    # rescue JWT::ExpiredSignature
    #   [403, { 'Content-Type' => 'text/plain' }, ['The token has expired.']]
    # rescue JWT::InvalidIssuerError
    #   [403, { 'Content-Type' => 'text/plain' }, ['The token does not have a valid issuer.']]
    # rescue JWT::InvalidIatError
    #   [403, { 'Content-Type' => 'text/plain' }, ['The token does not have a valid "issued at" time.']]

    user = payload['user']
    valid_user = User.find_by(user_name: user['username'])

    if valid_user
      valid_user.movies.sorted_list.to_json
    else
      halt 403
    end
  end
  def token u
    JWT.encode payload(u), ENV['JWT_SECRET'], 'HS256'
  end

  def payload u
    {
        exp: Time.now.to_i + 60 * 1440,
        iat: Time.now.to_i,
        iss: ENV['JWT_ISSUER'],
        user: {
            username: u.user_name,
            fullname: u.full_name
        }
    }
  end
end