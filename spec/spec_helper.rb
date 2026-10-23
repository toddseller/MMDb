require 'rubygems'

# All our specs should require 'spec_helper' (this file)

# If RACK_ENV isn't set, set it to 'test'.  Sinatra defaults to development,
# so we have to override that unless we want to set RACK_ENV=test from the
# command line when we run rake spec.  That's tedious, so do it here.
ENV['RACK_ENV'] ||= 'test'

# Always use the local test database: .env sets DATABASE_URL to a real server,
# and Dotenv.load never overrides a variable that is already set.
ENV['DATABASE_URL'] = 'postgres://localhost/MMDb_test'

require File.expand_path("../../config/environment", __FILE__)

# The migrations don't build the production schema (shows."episodeCount" was added by hand),
# so load db/structure.sql, a `pg_dump --schema-only` of production, into an empty test DB.
unless ActiveRecord::Base.connection.table_exists?(:shows)
  system('psql', '-q', '-o', File::NULL, '-v', 'ON_ERROR_STOP=1', '-d', DB_NAME, '-f', APP_ROOT.join('db', 'structure.sql').to_s, exception: true)
end

# Collects the SQL each block runs, skipping schema lookups and transaction statements.
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
