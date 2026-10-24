# Started before anything else, because SimpleCov only sees files loaded after it.
require 'simplecov'
SimpleCov.start do
  add_filter '/spec/'
  track_files '{app,config}/**/*.rb'
end

require 'rubygems'

# If RACK_ENV isn't set, set it to 'test'.  Sinatra defaults to development,
# so we have to override that unless we want to set RACK_ENV=test from the
# command line when we run rake spec.  That's tedious, so do it here.
ENV['RACK_ENV'] ||= 'test'

# Always use the local test database: .env sets DATABASE_URL to a real server,
# and Dotenv.load never overrides a variable that is already set.
ENV['DATABASE_URL'] = 'postgres://localhost/MMDb_test'

require_relative 'support/test_env'

require File.expand_path("../../config/environment", __FILE__)

# The migrations don't build the production schema (shows."episodeCount" was added by hand),
# so load db/structure.sql, a `pg_dump --schema-only` of production, into an empty test DB.
unless ActiveRecord::Base.connection.table_exists?(:shows)
  system('psql', '-q', '-o', File::NULL, '-v', 'ON_ERROR_STOP=1', '-d', DB_NAME, '-f', APP_ROOT.join('db', 'structure.sql').to_s, exception: true)
end

# ActiveRecord sends SCHEMA and TRANSACTION statements on its own, so counting them would make query counts noisy.
module QueryCounter
  def queries
    sqls = []
    counter = lambda do |*, payload|
      sqls << payload[:sql] unless %w[SCHEMA TRANSACTION].include?(payload[:name])
    end
    ActiveSupport::Notifications.subscribed(counter, 'sql.active_record') { yield }
    sqls
  end
end

RSpec.configure do |config|
  config.include QueryCounter

  config.around do |example|
    ActiveRecord::Base.transaction do
      example.run
      raise ActiveRecord::Rollback
    end
  end
end

Dir[APP_ROOT.join('spec', 'support', '*.rb')].sort.each { |file| require file }
