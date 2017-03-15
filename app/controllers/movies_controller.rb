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
  user = User.find(params[:id])
  @my_movies = Movie.filter_movies(params[:title], params[:id]).sorted_list
  if request.xhr?
    erb :"/partials/_filtered_list", layout: false, locals: {user: user}
  end
end

get '/movies/tmdb' do
  title = params[:query].downcase
  year = params[:year]
  query = Movie.search_title(title, year)
  if request.xhr?
    json query: query
  end
end
