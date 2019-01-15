post '/sessions' do
  user = User.find_by(email: params[:username_email]) || User.find_by(user_name: params[:username_email])
  # if user && user.authenticate(params[:password])
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
  # end
  if user && user.authenticate(params[:password])
    {message: "You've logged in. Yay you!!"}.to_json
  else
    halt 404
  end
end

post '/sessions/:id' do
  session[:user_id] = nil
  session[:name] = nil
  session[:theme] = 'default'
  redirect '/'
end
