get '/movies/:id/show' do
  p movie = Movie.find(params[:id])
end