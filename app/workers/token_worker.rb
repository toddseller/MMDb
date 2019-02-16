class TokenWorker
  include Sidekiq::Worker

  def perform
    # token_response = Show.tvdb_call("https://api.thetvdb.com/refresh_token")
    # Show.heroku_call(token_response[:body]['token'])
    puts "Ran Token Worker"
  end
end