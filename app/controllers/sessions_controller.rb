post '/sessions' do
  user = User.find_by(email: params[:username_email]) || User.find_by(user_name: params[:username_email])
  if user && user.authenticate(params[:password])
    session[:user_id] = user.id
    session[:password_fingerprint] = user.password_fingerprint
    session[:name] = user.full_name
    session[:theme] = user.theme
    session[:remember] = params[:remember] == 'true'
    extend_session
    if request.xhr?
      json status: "true", handle: user.handle
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
  sign_out!
  redirect '/'
end
