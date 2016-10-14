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
  if request.xhr?
    page = erb :'/partials/_movie_list', locals: {movie: @my_movies, user: @user}, layout: false
    json status: "true", page: page
  else
    erb :'/users/show'
  end
end

get '/users/:id/edit' do
  @user = User.find(params[:id])
  erb :'/partials/_edit_user', layout: false, locals: {user: @user}
end

put '/users/:id' do
  @user = User.find(params[:id])
  if params[:current] == ''
    @user.update(first_name: params[:first_name], last_name: params[:last_name], user_name: params[:user_name], email: params[:email], theme: params[:theme], password_hash: @user.password_hash)
      session[:name] = @user.full_name
      session[:theme] = @user.theme
    json status: "true", name: @user.full_name, theme: @user.theme
  else
    if @user.authenticate(params[:current])
      @user.update(first_name: params[:first_name], last_name: params[:last_name], user_name: params[:user_name], email: params[:email], theme: params[:theme], password: params[:password])
      session[:name] = @user.full_name
      session[:theme] = @user.theme
      json status: "true", name: @user.full_name, theme: @user.theme
    else
      json status: "false"
    end
  end
end
