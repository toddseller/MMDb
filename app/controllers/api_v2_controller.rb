namespace '/api/v2' do
  before do
    content_type 'application/json'
  end

  post '/authenticate' do
    user = User.find_by(email: params[:username_email]) || User.find_by(user_name: params[:username_email])
    # if user && user.authenticate(params[:password])
    #   {message: "You've logged in. Yay you!!"}.to_json
    # else
    #   halt 404
    # end
    {message: "In authenticate route!", user_name: user.user_name}.to_json
  end

  get '/movies' do
    user = User.find(params[:user_key])
    user.movies.sorted_list.to_json
  end

end