post '/movies' do
  user = User.find(session[:user_id])
  movie = Movie.find_by("title = ? AND year = ?", params[:movie]['title'], params[:movie]['year']) || Movie.new(params[:movie])
  if movie.save
    movie.users << user if !movie.users.include?(user)
    if request.xhr?
      page = erb :'/partials/_my_movies', locals: { movie: movie, user: user }, layout: false
      json status: "true", page: page
    end
  end
end

get '/movies/:id' do
  p params[:user]
  user = User.find(params[:user])
  movie = Movie.find(params[:id])
  if request.xhr?
    page = erb :'/partials/_modal', locals: {movie: movie, user: user}, layout: false
    json page
  end
end

get '/movies/:id/edit' do
  @movie = Movie.find(params[:id])
  # page = erb :'/partials/_edit_movie', locals: { movie: @movie }, layout: false
  # json page: page
  erb :'/partials/_edit_movie', layout: false
end

put '/movies/:id' do
  @movie = Movie.find(params[:id])
  @movie.update(params[:movie])
  @user = User.find(session[:user_id])
  p @movie
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

delete '/movies/:id' do
  @movie = Movie.find(params[:id])
  @user = User.find(session[:user_id])
  @my_movies = @user.movies.sorted_list
  @movie.users.destroy(@user)
  erb :'/users/show'
end
