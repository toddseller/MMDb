# Runs the app for the browser tests: its own database, the suite's fixed settings, and no outbound requests.
# Usage: bundle exec ruby e2e/server.rb
require_relative 'database'

require 'webmock'
WebMock.enable!
WebMock.disable_net_connect!(allow_localhost: true)

require 'rack'
require 'rackup'

PORT = 4667

app = Rack::Builder.parse_file(File.expand_path('../config.ru', __dir__))
Rackup::Handler.get('puma').run(app, Host: '127.0.0.1', Port: PORT, Silent: true)
