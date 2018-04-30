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
        @season.update(is_active: true)
        @season
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
  show = Show.find(params[:id])
  season = show.seasons.find_by(is_active: true)
  episodes = season.episodes.sorted_list
  if request.xhr?
    page = erb :'/partials/_show_info', locals: {show: show, user: user, season: season, episodes: episodes}, layout: false
    json page
  end
end

get '/users/:user_id/shows/:id/edit' do
  @show = Show.find(params[:id])
  @season = @show.seasons.find_by(is_active: true)
  @episodes = @season.episodes.sorted_list
  @episode = @episodes[0]
  @count = @episodes.count
  @next_episode = @episodes[1] if @episodes.count > 1
  @user = current_user
  if request.xhr?
    page = erb :'/partials/_edit_show', locals: {show: @show, user: @user, season: @season, episode: @episode, count: @count, next_episode: @next_episode}, layout: false
    json page
  else
    erb :'/partials/_edit_show', layout: false
  end
end

put '/users/:user_id/shows/:id' do
  @show = Show.find(params[:id])
  @show.update(params[:show])
  @season = @show.seasons.find_by(is_active: true)
  @season.update(params[:season])
  @episode = @season.episodes.find(params[:form]['id'])
  @episode.update(params[:episode])
  @episodes = @season.episodes.sorted_list

  @user = current_user
  if request.xhr?
    page = erb :'/partials/_show_info', locals: {show: @show, user: @user, season: @season, episodes: @episodes}, layout: false
    json page
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
