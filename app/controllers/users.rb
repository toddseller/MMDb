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

post '/users/:user_id/movies' do
  @user = User.find(params[:user_id])
  movie = Movie.find_by("title = ? AND year = ?", params[:movie]['title'], params[:movie]['year']) || Movie.new(params[:movie])
  if movie.save
    movie.users << @user if !movie.users.include?(@user)
    @my_movies = @user.movies.sorted_list
    if request.xhr?
      page = erb :'/partials/_all_movies', locals: {movie: @my_movies, user: @user}, layout: false
      json status: "true", page: page
    else
      erb :'/users/show'
    end
  end
end

get '/users/:user_id/movies/:id' do
  user = User.find(params[:user_id])
  movie = Movie.find(params[:id])
  if request.xhr?
    page = erb :'/partials/_modal', locals: {movie: movie, user: user}, layout: false
    json page
  end
end

get '/users/:user_id/movies/:id/edit' do
  @movie = Movie.find(params[:id])
  @user = User.find(params[:user_id])
  # page = erb :'/partials/_edit_movie', locals: { movie: @movie }, layout: false
  # json page: page
  erb :'/partials/_edit_movie', layout: false
end

put '/users/:user_id/movies/:id' do
  @movie = Movie.find(params[:id])
  @movie.update(params[:movie])
  @user = User.find(params[:user_id])
  @my_movies = @user.movies.sorted_list
  if request.xhr?
    page = erb :'/partials/_modal', locals: {movie: @movie, user: @user}, layout: false
    id = @movie.id
    image = @movie.poster
    title = @movie.title
    json page: page, id: id, image: image, title: title
  else
    erb :'/users/show'
  end
end

delete '/users/:user_id/movies/:id' do
  @movie = Movie.find(params[:id])
  @user = User.find(params[:user_id])
  @movie.users.destroy(@user)
  if request.xhr?
    @my_movies = @user.movies.sorted_list
    page = erb :'/partials/_all_movies', locals: {movie: @my_movies, user: @user}, layout: false
    json status: "true", page: page
  else
    @my_movies = @user.movies.sorted_list
    erb :'/users/show'
  end
end

