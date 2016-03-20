get '/movies/:id/edit' do
  @movie = Movie.find(params[:id])
  # page = erb :'/partials/_edit_movie', locals: { movie: @movie }, layout: false
  # json page: page
  erb :'/partials/_edit_movie', layout: false
end

post '/movies' do
  user = User.find(session[:user_id])
  movie = Movie.find_by("title = ? AND year = ?", params[:movie]['title'], params[:movie]['year']) || Movie.new(params[:movie])
  if movie.save
    movie.users << user if !movie.users.include?(user)
    if request.xhr?
      page = erb :'/partials/_my_movies', locals: { movie: movie }, layout: false
      json status: "true", page: page
    end
  end   
end

put '/movies/:id' do
  @movie = Movie.find(params[:id])
  @movie.update(params[:movie])
  @user = User.find(session[:user_id])
  @my_movies = @user.movies.sorted_list
  erb :'/users/show'
  # page = erb :'/partials/_description', locals: { movie: @movie }, layout: false
  # json page: page
end

delete '/movies/:id' do
  @movie = Movie.find(params[:id])
  @user = User.find(session[:user_id])
  @my_movies = @user.movies.sorted_list
  @movie.users.destroy(@user)
  erb :'/users/show'
end

# put '/items/:id' do
#   @item = Item.find(params[:id])
#   @item.update(params[:item])
#   @user = User.find(@item.creator_id)
#   if @item.save
#     erb :'/users/show'
#   else
#     @errors = @errors = errors.full_messages.join(" and ")
#     redirect "/items/#{item.id}/edit?errors=#{@errors}"
#   end
# end

# delete '/items/:id' do
#   @item = Item.find(params[:id])
#   @user = User.find(@item.creator_id)
#   @item.destroy
#   erb :'/users/show'
# end