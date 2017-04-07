get '/api/movies' do
  user = params[':user_key']
  movies = user.movies.sorted_list

  json movies: movies
end
