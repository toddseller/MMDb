# Puma configuration file for production

# Set the environment
environment ENV.fetch('RACK_ENV', 'production')

# Number of threads per worker
threads_count = ENV.fetch('PUMA_THREADS', 5).to_i
threads threads_count, threads_count

# Bind to all interfaces in production
bind "tcp://0.0.0.0:#{ENV.fetch('PORT', 4666)}"

# Workers (processes)
workers ENV.fetch('WEB_CONCURRENCY', 2).to_i

# Preload application for better performance
preload_app!

# Logging
stdout_redirect(
  ENV.fetch('PUMA_STDOUT_LOG', 'log/puma_stdout.log'),
  ENV.fetch('PUMA_STDERR_LOG', 'log/puma_stderr.log'),
  true
) if ENV['RACK_ENV'] == 'production'

# Daemonize
# pidfile ENV.fetch('PIDFILE', 'tmp/pids/puma.pid')

# Allow puma to be restarted by `rails restart` command
plugin :tmp_restart

# Renamed from on_worker_boot (deprecated in Puma 7)
before_worker_boot do
  ActiveRecord::Base.connection_pool.disconnect! if defined?(ActiveRecord)
end

# Renamed from on_worker_fork
after_worker_boot do
  ActiveRecord::Base.establish_connection if defined?(ActiveRecord)
end
