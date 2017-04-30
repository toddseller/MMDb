use Rack::Cors do |config|
  config.allow do |allow|

    allow.origins 'http://toddseller.com', 'http://www.toddseller.com'
    allow.resource '/api/movies/count',
      :methods => [:get],
      :headers => :any,
      :max_age => 0
    allow.resource '/api/year',
      :methods => [:get],
      :headers => :any,
      :max_age => 0
  end
end

get '/api/movies' do
  user = User.find(params[:user_key])
  movies = user.movies.sorted_list

  json movies: movies
end

get '/api/movies/count' do
  user = User.find(params[:user_key])
  count = user.movies.count

  json count
end

get '/api/year' do
  year = DateTime.now.year

  json year
end