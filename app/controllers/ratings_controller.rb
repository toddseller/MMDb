post '/movies/:id/ratings' do
  movie = Movie.find(params[:id])
  user = current_user
  rating = movie.ratings.find_or_create_by(user_id: user.id)
  rating.update(stars: params[:rating])
  if request.xhr?
    erb :'/partials/_ratings_form', layout: false, locals: {movie: movie}
  else
    redirect "/users/#{user.id}"
  end
end