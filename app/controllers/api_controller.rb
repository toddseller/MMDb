get '/api/movies' do
  user = User.find(params[:user_key])
  movies = user.movies.sorted_list

  json movies: movies
end

get '/api/movies/count' do
  user = User.find(params[:user_key])
  count = user.movies.count

  json count
end
