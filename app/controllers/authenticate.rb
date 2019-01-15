post '/authenticate' do
  before do
    content_type 'application/json'
  end

  user = User.find_by(email: params[:username_email]) || User.find_by(user_name: params[:username_email])
  if user && user.authenticate(params[:password])
  #   session[:user_id] = user.id
  #   session[:name] = user.full_name
  #   session[:theme] = user.theme
  #   if request.xhr?
  #     json status: "true", user_id: user.id
  #   else
  #     erb :'/users/show'
  #   end
  # else
  #   if request.xhr?
  #     json status: "false"
  #   end
    {message: "You've logged in. Yay you!!"}.to_json
  else
    halt 404
  end
end