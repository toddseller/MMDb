post '/users/:user_id/movies' do
  p '*' * 25
  p @user = current_user
  p '+' * 25
  p movie = Movie.find_by("title = ? AND year = ?", params[:movie]['title'], params[:movie]['year']) || Movie.new(params[:movie])
  if movie.save
    p '*' * 25
    p movie.users << @user if !movie.users.include?(@user)
    p '+' * 25
    p @my_movies = Movie.filter_movies(params[:filter], @user.id).sorted_list
    if request.xhr?
      page = erb :'/partials/_movie_list', locals: {movie: @my_movies, user: @user}, layout: false
      json status: "true", page: page
    else
      erb :'/users/show'
    end
  end
end

get '/users/:user_id/movies/:id' do
  user = current_user if current_user == User.find(params[:user_id])
  movie = Movie.find(params[:id])
  if request.xhr?
    page = erb :'/partials/_info', locals: {movie: movie, user: user}, layout: false
    json page
  end
end

get '/users/:user_id/movies/:id/edit' do
  @movie = Movie.find(params[:id])
  @user = current_user
  if request.xhr?
    page = erb :'/partials/_edit_movie', locals: {movie: @movie, user: @user}, layout: false
    json page
  else
    erb :'/partials/_edit_movie', layout: false
  end
end

put '/users/:user_id/movies/:id' do
  @movie = Movie.find(params[:id])
  @movie.update(params[:movie])
  @user = current_user
  if request.xhr?
    @my_movies = Movie.filter_movies(params[:filter], @user.id).sorted_list
    page = erb :'/partials/_info', locals: {movie: @movie, user: @user}, layout: false
    list = erb :'/partials/_filtered_list', locals: {movie: @my_movies, user: @user}, layout: false
    json page: page, query: list, id: @movie.id
  else
    erb :'/users/show'
  end
end

delete '/users/:user_id/movies/:id' do
  @movie = Movie.find(params[:id])
  @user = current_user
  @movie.users.destroy(@user)
  if request.xhr?
    @my_movies = Movie.filter_movies(params[:filter], @user.id).sorted_list
    page = erb :'/partials/_filtered_list', locals: {movie: @my_movies, user: @user}, layout: false
    json status: "true", page: page
  else
    @my_movies = @user.movies.sorted_list
    erb :'/users/show'
  end
end
