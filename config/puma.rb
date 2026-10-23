# Puma configuration file for production

# Set the environment
# Use RACK_ENV from environment, or default to production if not set
rack_env = ENV['RACK_ENV'] || 'production'
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
  # Use RACK_ENV to determine worker count if WEB_CONCURRENCY is not set
  # Ensure it defaults to at least 2 in production to enable cluster mode
  worker_count = (rack_env == 'production') ? 2 : 0
end
workers worker_count

# Preload application for better performance (only in production with workers)
preload_app! if worker_count > 0

# Logging
if rack_env == 'production'
  stdout_redirect(
    ENV.fetch('PUMA_STDOUT_LOG', 'log/puma_stdout.log'),
    ENV.fetch('PUMA_STDERR_LOG', 'log/puma_stderr.log'),
    true
  )
end

# Allow puma to be restarted by `rails restart` command
plugin :tmp_restart

# before_worker_boot is used for actions before the workers are forked
# Only executes in cluster mode
if worker_count > 0
  before_worker_boot do
    ActiveRecord::Base.connection_pool.disconnect! if defined?(ActiveRecord)
  end

  # after_worker_fork executes in the worker process after it has been forked
  after_worker_fork do
    if defined?(ActiveRecord)
      ActiveRecord::Base.establish_connection
    end
  end
end
