use JwtAuth

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
  end

  get '/movies' do
    user = request.env.values_at :user
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
        exp: Time.now.to_i + 60 * 60,
        iat: Time.now.to_i,
        iss: ENV['JWT_ISSUER'],
        user: {
            username: u.user_name,
            fullname: u.full_name
        }
    }
  end
end