get '/shows' do
  title = params[:query].downcase
  @user = current_user
  @show_previews = Show.get_series(title)
  page = erb :"/partials/_shows_preview", layout: false
  if request.xhr?
    json query: @show_previews, page: page
  end
end
