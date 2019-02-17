web: bundle exec puma -t 5:5 -p $PORT -e $RACK_ENV
worker: bundle exec sidekiq -e $RACK_ENV -r ./config/environment.rb -c 1