# Require config/environment.rb
require ::File.expand_path('../config/environment',  __FILE__)

set :app_file, __FILE__

configure do
  # See: http://www.sinatrarb.com/faq.html#sessions
  enable :sessions
  set :session_secret, ENV['SESSION_SECRET'] || 'this is a secret shhhhh'

  # Set the views to 
  set :views, File.join(Sinatra::Application.root, "app", "views")
end

use Rack::Cors do
  allow do
    origins 'localhost:3000', 'myflix-stream.herokuapp.com', 'myflix.stream'

    resource '/api/v2/*',
             methods: [:get, :post, :delete, :put, :patch, :options, :head],
             headers: :any,
             :expose  => ['access-token', 'expiry', 'token-type', 'Authorization'],
             max_age: 0
  end
end

use Rack::PostBodyContentTypeParser

run Sinatra::Application
