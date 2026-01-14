# Puma configuration file for production

# Set the environment
rack_env = ENV.fetch('RACK_ENV', 'production')
environment rack_env

# Number of threads per worker
threads_count = ENV.fetch('PUMA_THREADS', 5).to_i
threads threads_count, threads_count

# Bind to all interfaces in production
bind "tcp://0.0.0.0:#{ENV.fetch('PORT', 4666)}"

# Workers (processes)
# Default to 0 (single mode) for development on macOS to avoid fork() crashes
# Set to 2+ for production
if ENV['WEB_CONCURRENCY']
  worker_count = ENV['WEB_CONCURRENCY'].to_i
else
  worker_count = (rack_env == 'production') ? 2 : 0
end
workers worker_count

# Preload application for better performance (only in production with workers)
preload_app! if worker_count > 0

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
  if defined?(ActiveRecord)
    ActiveRecord::Base.establish_connection
    ActiveRecord::Base.connection.verify!
  end
end
