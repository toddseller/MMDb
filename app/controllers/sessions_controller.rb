post '/sessions' do
  user = User.find_by(email: params[:username_email]) || User.find_by(user_name: params[:username_email])
  if user && user.authenticate(params[:password])
    session[:user_id] = user.id
    session[:name] = user.full_name
    if request.xhr?
      json status: "true", user_id: user.id
    else
      erb :'/users/show'
    end
  else
    if request.xhr?
      json status: "false"
    end
  end
end

post '/sessions/:id' do
  session[:user_id] = nil
  session[:name] = nil
  redirect '/'
end