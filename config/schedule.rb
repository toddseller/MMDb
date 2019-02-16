job_type :sidekiq, "cd :path && :environment_variable=:environment bundle exec sidekiq-client push :task :output"
