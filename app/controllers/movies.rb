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