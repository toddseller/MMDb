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
  p 'Here'
  title = params[:title].downcase
  user = User.find(params[:id])
  movies = Movie.where('search_name LIKE ?', "%#{title}%")
  movies = movies.sorted_list
  @my_movies = []
  movies.each { |movie| @my_movies << movie if movie.users.include?(user) }
  p @my_movies
  if request.xhr?
    erb :"/partials/_movie_list", layout: false, locals: {user: user}
  end
end
