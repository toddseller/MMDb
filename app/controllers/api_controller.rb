use Rack::Cors do |config|
  config.allow do |allow|
    allow.origins '*'
    allow.resource '/api/movies/count',
        :methods =&gt; [:get],
        :headers =&gt; :any,
        :max_age =&gt; 0
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
