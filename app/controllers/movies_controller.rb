get '/movies' do
  title = params[:query].downcase
  if params[:year] != ''
    movie = Movie.where("search_name LIKE ? AND year = ?","%#{title}%", params[:year])
  else
    movie = Movie.where("search_name LIKE ?", "%#{title}%")
  end
  if request.xhr?
    json movie: movie, query: params
  end
end

get '/movies/:id/show' do
  movie = Movie.find(params[:id])
  if request.xhr?
    erb :"/partials/_preview_modal", layout: false, locals: {movie: movie}
  end
end

get '/movies/filter' do
  # title = params[:title].downcase
  user = User.find(params[:id])
  # movies = user.movies
  # movies = movies.where('search_name LIKE ?', "%#{title}%")
  p '*' * 50
  p @my_movies = Movie.filter_movies(params[:title], params[:id]).sorted_list
  if request.xhr?
    erb :"/partials/_movie_list", layout: false, locals: {user: user}
  end
end

get '/movies/tmdb' do
  title = params[:query].downcase
  year = params[:year]
  p query = Movie.search_title(title, year)
  if request.xhr?
    json query: query
  end
end
