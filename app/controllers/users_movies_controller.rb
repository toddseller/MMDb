get '/users/:user_id/movies' do
  @user = User.find(params[:user_id])
  @my_movies = @user.movies.sorted_list
  @shows = @user.shows
  if request.xhr?
    page = erb :'/partials/_movie_list', locals: {movie: @my_movies, user: @user, shows: @shows}, layout: false
    json status: "true", page: page
  else
    erb :'/movies/show'
  end
end

post '/users/:user_id/movies' do
  @user = current_user
  movie = Movie.find_by("title = ? AND year = ?", params[:movie]['title'], params[:movie]['year']) || Movie.new(params[:movie])
  if movie.save
    movie.users << @user if !movie.users.include?(@user)
    @my_movies = Movie.filter_movies(params[:filter], @user.id).sorted_list
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
  library_key = params[:user_id] == ENV['LIBRARY_KEY']
  movie = Movie.find(params[:id])
  link = URI::encode(movie.title.gsub(/[*:;\/]/,'_'))
  file = movie.file_name.length > 0 ? URI::encode(movie.file_name.gsub(/[*:;\/]/,'_')) : URI::encode(movie.title.gsub(/[*:;\/]/,'_'))
  if request.xhr?
    page = erb :'/partials/_info', locals: {movie: movie, user: user, link: link, file: file, library_key: library_key}, layout: false
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
  link = URI::encode(@movie.title.gsub(/[*:;\/]/,'_'))
  file = @movie.file_name.length > 0 ? URI::encode(@movie.file_name.gsub(/[*:;\/]/,'_')) : URI::encode(@movie.title.gsub(/[*:;\/]/,'_'))
  library_key = params[:user_id] == ENV['LIBRARY_KEY']
  if request.xhr?
    @my_movies = params[:filter] != nil ? Movie.filter_movies(params[:filter], @user.id).sorted_list : Movie.search(params[:name], @user.id).sorted_list

    page = erb :'/partials/_info', locals: {movie: @movie, user: @user, link: link, file: file, library_key: library_key}, layout: false
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
    @my_movies = params[:filter] != nil ? Movie.filter_movies(params[:filter], @user.id).sorted_list : Movie.search(params[:name], @user.id).sorted_list
    page = erb :'/partials/_filtered_list', locals: {movie: @my_movies, user: @user}, layout: false
    json status: "true", page: page
  else
    @my_movies = @user.movies.sorted_list
    erb :'/users/show'
  end
end
