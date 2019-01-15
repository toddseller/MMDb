namespace '/api/v2' do
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

    def token user
      JWT.encode payload(user), ENV['JWT_SECRET'], 'HS256'
    end

    def payload user
      {
          exp: Time.now.to_i + 60 * 60,
          iat: Time.now.to_i,
          iss: ENV['JWT_ISSUER'],
          user: {
              username: user.user_name,
              fullname: user.full_name
          }
      }
    end
  end

  get '/movies' do
    user = User.find(params[:user_key])
    user.movies.sorted_list.to_json
  end

end