post '/users/:user_id/shows/:show_id/seasons/:id' do
  user = current_user
  show = Show.find(params[:show_id])
  p '+' * 80
  p seasons = show.seasons.sorted_seasons
  seasons.each do |s|
    s.season.to_s == params[:id] ? s.update(is_active: true) : s.update(is_active: false)
  end
  season = seasons.find_by(season: params[:id])
  show.update(poster: season.poster)
  poster = show.poster
  episodes = season.episodes.sorted_list
  if request.xhr?
    page = erb :'/partials/_show_info', locals: {show: show, user: user, season: season, episodes: episodes}, layout: false
    poster = poster
    json page: page, poster: poster
  end
end
