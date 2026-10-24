# Runs the app for the browser tests: its own database, the suite's fixed settings, and no outbound requests.
# Usage: bundle exec ruby e2e/server.rb
ENV['RACK_ENV'] ||= 'test'
# Set before the app loads, so a local .env (which points at production) can't override it.
ENV['DATABASE_URL'] = 'postgres://localhost/MMDb_e2e'
require_relative '../spec/support/test_env'

require 'webmock'
WebMock.enable!
WebMock.disable_net_connect!(allow_localhost: true)

require 'rack'
require 'rackup'

PORT = 4667

app = Rack::Builder.parse_file(File.expand_path('../config.ru', __dir__))
Rackup::Handler.get('puma').run(app, Host: '127.0.0.1', Port: PORT, Silent: true)
