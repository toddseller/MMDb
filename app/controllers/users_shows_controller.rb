get '/users/:user_id/shows' do
  @user = User.find(params[:user_id])
  @my_shows = @user.shows.sorted_list
  if request.xhr?
    page = erb :'/partials/_show_list', locals: {show: @my_shows, user: @user}, layout: false
    json status: "true", page: page
  else
    erb :'/shows/show'
  end
end

post '/users/:user_id/shows' do
  @user = current_user
  @show = Show.find_by("title = ?", params[:show]['title']) || Show.new(title: params[:show]['title'], year: params[:show]['year'], rating: params[:show]['rating'], genre: params[:show]['genre'], poster: params[:season]['poster'])
  @season = Season.find_by(collectionId: params[:season]['collectionId']) || @show.seasons.new(params[:season])
  if @show.save
    @show.users << @user if !@show.users.include?(@user)
    if @season.save
      if @show.seasons.length == 1
        p '*' * 80
        @season.update(is_active: true)
        p @season
      end
      @episodes_previews = Show.get_episodes(@season.collectionId)
    end

    if request.xhr?
      page = erb :'/partials/_episodes_preview', locals: {episode: @episodes_previews, user: @user, show: @show, season: @season}, layout: false
      json status: "true", page: page
    else
      erb :'/shows/show'
    end
  end
end

get '/users/:user_id/shows/:id' do
  user = current_user if current_user == User.find(params[:user_id])
  # library_key = params[:user_id] == ENV['LIBRARY_KEY']
  show = Show.find(params[:id])
  p '*' * 80
  p season = show.seasons.find_by(is_active: true)
  p episodes = season.episodes.sorted_list
  # link = URI::encode(movie.title.gsub(/[*:;\/]/,'_'))
  # file = movie.file_name.length > 0 ? URI::encode(movie.file_name.gsub(/[*:;\/]/,'_')) : URI::encode(movie.title.gsub(/[*:;\/]/,'_'))
  # link: link, file: file, library_key: library_key
  if request.xhr?
    page = erb :'/partials/_show_info', locals: {show: show, user: user, season: season, episodes: episodes}, layout: false
    json page
  end
end

get '/users/:user_id/shows/:id/edit' do
  @movie = Movie.find(params[:id])
  @user = current_user
  if request.xhr?
    page = erb :'/partials/_edit_movie', locals: {movie: @movie, user: @user}, layout: false
    json page
  else
    erb :'/partials/_edit_movie', layout: false
  end
end

put '/users/:user_id/shows/:id' do
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

delete '/users/:user_id/shows/:id' do
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
