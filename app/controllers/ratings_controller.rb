post '/movies/:id/ratings' do
  movie = Movie.find(params[:id])
  user = User.find(session[:user_id])
  rating = movie.ratings.find_by(user_id: user.id) || movie.ratings.create(user_id: user.id)
  rating.update(stars: params[:rating])
  if request.xhr?
    erb :'/partials/_ratings_form', layout: false, locals: {movie: movie}
  else
    redirect "/users/#{session[:user_id]}"
  end
end