get '/movies' do
  title = params[:query].downcase
  @user = current_user
  @movie_previews = Movie.search_title(title)
  page = erb :"/partials/_preview", layout: false
  if request.xhr?
    json query: @movie_previews, page: page
  end
end

get '/movies/:id/show' do
  movie = Movie.find(params[:id])
  if request.xhr?
    erb :"/partials/_preview_modal", layout: false, locals: {movie: movie}
  end
end

get '/movies/filter' do
  user = User.find(params[:id])
  @my_movies = Movie.filter_movies(params[:title], params[:id]).sorted_list
  if request.xhr?
    erb :"/partials/_filtered_list", layout: false, locals: {user: user}
  end
end

get '/movies/new/:id' do
  user = User.find(params[:id])
  @my_movies = user.movies.where('isnew').sorted_list
  if request.xhr?
    erb :"/partials/_filtered_list", layout: false, locals: {user: user}
  end
end
