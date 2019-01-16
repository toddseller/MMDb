get '/' do
  # Look in app/views/index.erb
  # redirect '/users'
  @users = User.all
  @movies = Movie.all
  erb :'users/index'
end