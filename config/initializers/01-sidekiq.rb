require 'sidekiq'

Sidekiq.configure_client do |config|
  config.REDIS = { :size => 1 }
end

Sidekiq.configure_server do |config|
  config.REDIS = { :size => 2 }
end