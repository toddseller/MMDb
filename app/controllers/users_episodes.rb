post '/users/:user_id/shows/:show_id/seasons/:season_id/episodes' do
  @user = current_user
  @my_shows = @user.shows.sorted_list
  @show = Show.find(params[:show_id])
  @season = @show.seasons.find(params[:season_id])
  if params.has_key?('episode')
    @episode = @season.episodes.find_by(tv_episode: params[:episode]['tv_episode']) || @season.episodes.new(params[:episode])
    if @episode.save
      @season.episodes << @episode if !@season.episodes.include?(@episode)
    end
  else
    params['episodes'].each do |e|
      @episode = @season.episodes.find_by(tv_episode: e[:tv_episode]) || @season.episodes.new(e)
      if @episode.save
        @season.episodes << @episode if !@season.episodes.include?(@episode)
      end
    end
  end
  if request.xhr?
    page = erb :'/partials/_show_list', locals: {show: @my_shows, user: @user}, layout: false
    json status: "true", page: page
  else
    erb :'/shows/show'
  end
end

get '/users/:user_id/shows/:show_id/seasons/:season_id/episodes/:id/edit' do
  @show = Show.find(params[:show_id])
  @season = @show.seasons.find(params[:season_id])
  @episodes = @season.episodes.sorted_list
  @episode = @season.episodes.find(params[:id])
  @count = @episodes.count
  @next_episode = @episodes[@episodes.index(@episode) + 1]
  @previous_episode = @episodes[@episodes.index(@episode) - 1] if @episode.tv_episode.to_i != 1 && @episode.tv_episode != @episodes[0].tv_episode
  @user = current_user
  if request.xhr?
    page = erb :'/partials/_edit_show', locals: {show: @show, user: @user, season: @season, episode: @episode, count: @count, next_episode: @next_episode, previous_episode: @previous_episode}, layout: false
    json page
  else
    erb :'/partials/_edit_show', layout: false
  end
end

delete '/users/:user_id/shows/:show_id/seasons/:season_id/episodes/:id' do
  @show = Show.find(params[:show_id])
  @season = @show.seasons.find(params[:season_id])
  @episodes = @season.episodes.sorted_list
  @episode = @season.episodes.find(params[:id])
  p '+' * 50
  p episode_number = @episodes.index(@episode)
  @episode.destroy()
  @count = @episodes.count
  p @episode = episode_number != @count ? @episodes[episode_number + 1] : @episodes[episode_number - 1]
  @next_episode = @episodes[@episodes.index(@episode) + 1] if @episode.tv_episode.to_i != @episodes.count
  @previous_episode = @episodes[@episodes.index(@episode) - 1] if @episode.tv_episode.to_i != 1 && @episode.tv_episode != @episodes[0].tv_episode
  @user = current_user
  if request.xhr?
    page = erb :'/partials/_edit_show', locals: {show: @show, user: @user, season: @season, episode: @episode, count: @count, next_episode: @next_episode, previous_episode: @previous_episode}, layout: false
    json page
  else
    erb :'/partials/_edit_show', layout: false
  end
end
