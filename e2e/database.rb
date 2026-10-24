# The browser tests' own database, shared by the seed and the server. Playwright starts the server before it
# runs the seed, so on a fresh database (as in CI) the server must load the schema itself.
ENV['RACK_ENV'] ||= 'test'
# Set before the app loads, so a local .env (which points at production) can't override it.
ENV['DATABASE_URL'] = 'postgres://localhost/MMDb_e2e'
require_relative '../spec/support/test_env'
require_relative '../config/environment'

# Same schema source as the RSpec suite: the migrations don't build production's schema.
unless ActiveRecord::Base.connection.table_exists?(:shows)
  system('psql', '-q', '-o', File::NULL, '-v', 'ON_ERROR_STOP=1', '-d', DB_NAME, '-f', APP_ROOT.join('db', 'structure.sql').to_s, exception: true)
end
