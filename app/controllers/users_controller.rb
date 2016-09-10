get '/users' do
  @users = User.all
  @movies = Movie.all
  erb :'users/index'
end

get '/users/new' do
  erb :'users/new'
end

post '/users' do
  @user = User.create(params[:user])
  if @user.valid?
    session[:user_id] = @user.id
    session[:name] = @user.full_name
    redirect '/users'
  else
    redirect "/users/new?errors=#{@user.errors.full_messages.join(" and ")}"
  end
end

get '/users/:id' do
  @user = User.find(params[:id])
  @my_movies = @user.movies.sorted_list
  erb :'/users/show'
end

get '/users/:id/edit' do
  p @user = User.find(params[:id])
  erb :'/partials/_edit_user', layout: false, locals: {user: @user}
end

put '/users/:id' do
  @user = User.find(params[:id])
  if params[:password] == ''
    @user.update(first_name: params[:first_name], last_name: params[:last_name], user_name: params[:user_name], email: params[:email], password_hash: @user.password_hash)
    session[:name] = @user.full_name
  else
    @user.update(first_name: params[:first_name], last_name: params[:last_name], user_name: params[:user_name], email: params[:email], password: params[:password])
    session[:name] = @user.full_name
  end
  json session[:name]
end
