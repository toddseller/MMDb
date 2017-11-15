post '/users/:user_id/shows/:show_id/seasons/:season_id/episodes' do
  @user = current_user
  @my_shows = @user.shows.sorted_list
  @show = Show.find(params[:show_id])
  @season = @show.seasons.find(params[:season_id])
  @episode = @season.episodes.find_by(tv_episode: params[:episode]['tv_episode']) || @season.episodes.new(params[:episode])
  if @episode.save
    @season.episodes << @episode if !@season.episodes.include?(@episode)
    if request.xhr?
      page = erb :'/partials/_show_list', locals: {show: @my_shows, user: @user}, layout: false
      json status: "true", page: page
    else
      erb :'/shows/show'
    end
  end
end
