get '/shows' do
  title = params[:query].downcase
  @user = current_user
  @show_previews = Show.get_series(title)
  page = erb :"/partials/_shows_preview", layout: false
  if request.xhr?
    json query: @show_previews, page: page
  end
end

get '/shows/new' do
  page = erb :"/partials/_create_show", layout: false
  if request.xhr?
    json page: page
  end
end

post '/shows' do
  @user = current_user
  @my_shows = @user.shows.sorted_list
  @show = Show.find_by("title = ?", params[:show]['title']) || Show.new(title: params[:show]['title'], year: params[:show]['year'], rating: params[:show]['rating'], genre: params[:show]['genre'], poster: params[:season]['poster'])
  @season = Season.find_by(collectionName: params[:season]['collectionName']) || @show.seasons.new(params[:season])
  if @show.save
    @show.users << @user if !@show.users.include?(@user)
  end
  if @season.save
    if @show.seasons.length == 1
      @season.update(is_active: true)
    end
  end
  @episode = @season.episodes.find_by(tv_episode: params[:episode]['tv_episode']) || @season.episodes.new(params[:episode])
  if @episode.save
    @season.episodes << @episode if !@season.episodes.include?(@episode)
  end
  if request.xhr?
    if params[:new]
      form = erb :"/partials/_new_episode", layout: false
      page = erb :'/partials/_updated_show_list', locals: {show: @my_shows, user: @user}, layout: false
      json page: page, form: form
    else
      p '+' * 50
      p 'FUCKING NOT NEW'
      p params[:new]
    end
  end
end

