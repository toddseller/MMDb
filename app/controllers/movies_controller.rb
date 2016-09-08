get '/movies/:id/show' do
  movie = Movie.find(params[:id])
  if request.xhr?
    erb :"/partials/_preview_modal", layout: false, locals: {movie: movie}
  end
end