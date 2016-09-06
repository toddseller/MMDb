get '/users' do
  @users = User.all
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
