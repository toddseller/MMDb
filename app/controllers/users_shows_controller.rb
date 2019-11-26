get '/users/:user_id/shows' do
  @user = User.find(params[:user_id])
  @my_shows = @user.shows.sorted_list
  @movies = @user.movies
  @show_count = @user.shows.count.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\1,').reverse
  @episode_count = Episode.episode_count(@user.id)
  if request.xhr?
    page = erb :'/shows/show', layout: false
    json status: "true", page: page, show_count: @show_count, episode_count: @episode_count
  else
    erb :'/shows/show'
  end
end

get '/users/:user_id/shows/new' do
  @user = current_user
  page = erb :"/partials/_create_show",locals: {user: @user}, layout: false
  if request.xhr?
    json page: page
  end
end

post '/users/:user_id/shows' do
  @user = current_user
  @show = Show.find_by("title = ?", params[:show]['title']) || Show.new(title: params[:show]['title'], year: params[:show]['year'], rating: params[:show]['rating'], genre: params[:show]['genre'], poster: params[:season]['poster'])
  @season = Season.find_by(collectionId: params[:season]['collectionId']) || @show.seasons.new(params[:season])
  if @show.save
    @show.users << @user if !@show.users.include?(@user)
    if @season.save
      @season.update(count: params[:season]['count'])
      if @show.seasons.length == 1
        @season.update(is_active: true)
      end
      @episodes_previews = @season.skip ? Show.get_episodes(@season.appleTvId, @season.season, @season.skip, @season.count) : Show.get_episodes(@season.collectionId, @season.season)
      count = @episodes_previews.length
    end

    if request.xhr?
      page = erb :'/partials/_episodes_preview', locals: {episode: @episodes_previews, user: @user, show: @show, season: @season}, layout: false
      json status: "true", page: page, count: count
    else
      erb :'/shows/show'
    end
  end
end

get '/users/:user_id/shows/:id' do
  user = User.find(params[:user_id])
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
  if params[:show][:hd]
    @show.update(params[:show])
  else
    @show.update(rating: params[:show][:rating], genre: params[:show][:genre], year: params[:show][:year], hd: 480, title: params[:show][:title], sort_name: params[:show][:sort_name], poster: params[:show][:poster])
  end
  p ' * ' * 50
  p @show
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
    count = Episode.episode_count(@user.id)
    json status: "true", page: page, count: count
  else
    @my_movies = @user.movies.sorted_list
    erb :'/users/show'
  end
end
