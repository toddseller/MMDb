get '/movies' do
  title = params[:query].downcase
  @user = current_user
  @movie_previews = Movie.get_titles(title)
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
  @my_movies = Movie.filter_movies(params[:filter], params[:id]).sorted_list
  page = erb :"/partials/_filtered_list", layout: false, locals: {user: user}
  count = @my_movies.count.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\1,').reverse
  if request.xhr?
    json page: page, count: count
  end
end

get '/movies/search' do
  user = User.find(params[:id])
  @my_movies = Movie.search(params[:filter], params[:id]).sorted_list
  page = erb :"/partials/_filtered_list", layout: false, locals: {user: user}
  url = Movie.search_person(params[:filter]) != nil ? Movie.search_person(params[:filter]) : "no-image"
  if request.xhr?
    json page: page, url: url
  end
end

get '/movies/new/:id' do
  user = User.find(params[:id])
  @my_movies = user.movies.where('isnew').sorted_list
  if request.xhr?
    erb :"/partials/_filtered_list", layout: false, locals: {user: user}
  end
end

get '/movies/4k/:id' do
  user = User.find(params[:id])
  @my_movies = user.movies.where(hd: '4').sorted_list
  if request.xhr?
    erb :"/partials/_filtered_list", layout: false, locals: {user: user}
  end
end

get '/movies/update' do
  title = params[:title].downcase
  @id = params[:route].split('/').last
  @movie_previews = Movie.update_title_search(title)
  page = erb :"/partials/_update_preview", layout: false
  if request.xhr?
    json query: @movie_previews, page: page
  end
end

put '/movies/update/:id' do
  @movie = Movie.find(params[:id])
  params[:movie][:rating] = params[:movie][:rating].upcase
  @movie.update(params[:movie])
  @user = current_user
  if request.xhr?
    page = erb :'/partials/_edit_movie', locals: {movie: @movie, user: @user}, layout: false
    json page
  else
    erb :'/users/show'
  end
end
