use Rack::Cors do |config|
  
  config.allow do |allow|

    allow.origins 'http://toddseller.com', 'http://www.toddseller.com', 'http://test.toddseller.com', 'https://www.test.toddseller.com', 'https://toddseller.com', 'https://www.toddseller.com', 'https://test.toddseller.com', 'https://www.test.toddseller.com'
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

before '/api' do
  content_type 'application/json'
end

get '/api/movies' do
  user = User.find(params[:user_key])
  movies = user.movies.sorted_list

  json movies: movies
end

get '/api/movies/count' do
  # user = User.find(params[:user_key])
  # count = user.movies.count
  counts = Movie.plex_count

  counts.to_json
end

get '/api/year' do
  year = DateTime.now.year

  json year
end

get '/api/movies/new' do
  user = User.find(params[:user_key])
  movies = user.movies.where('isnew').sorted_list

  json movies
end

get '/api/movies/filter' do
  movies = Movie.filter_movies(params[:filter], params[:user_key]).sorted_list

  json movies
end
