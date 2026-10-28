# Set up gems listed in the Gemfile.
# See: http://gembundler.com/bundler_setup.html
#      http://stackoverflow.com/questions/7243486/why-do-you-need-require-bundler-setup
ENV['BUNDLE_GEMFILE'] ||= File.expand_path('../../Gemfile', __FILE__)

require 'bundler/setup' if File.exist?(ENV['BUNDLE_GEMFILE'])

# Require gems we care about
require 'rubygems'

require 'uri'
require 'cgi'
require 'net/http'
require 'pathname'

require 'pg'
require 'active_record'
require 'logger'

require 'sinatra'
require "sinatra/reloader" if development?
require 'sinatra/json'
require 'sinatra/base'
self.instance_eval do
  alias :namespace_pre_sinatra :namespace if self.respond_to?(:namespace, true)
end

require 'sinatra/namespace'

self.instance_eval do
  alias :namespace :namespace_pre_sinatra if self.respond_to?(:namespace_pre_sinatra, true)
end
require 'tilt/erubi'
require 'rack'
require 'rack/cors'
require 'rack/contrib'
require 'jwt'
require 'humanize'

require 'dotenv'
# Load .env file if it exists, but don't override existing environment variables
Dotenv.load if defined?(Dotenv)

# Without these, sessions or API tokens would be signed with a secret anyone could guess.
%w[SESSION_SECRET JWT_SECRET].each { |name| abort "#{name} must be set" if ENV[name].to_s.empty? }

require 'erb'
require 'bcrypt'
require 'httparty'
require 'nokogiri'
require 'will_paginate'
require 'will_paginate/active_record'
require 'htmlentities'
require 'aws-sdk-s3'

# Some helper constants for path-centric logic
APP_ROOT = Pathname.new(File.expand_path('../../', __FILE__))

APP_NAME = APP_ROOT.basename.to_s

# Set up the controllers and helpers
# We disable host_authorization specifically here as well to ensure it's picked up by namespaces
require 'rack/protection'
Sinatra::Application.set :protection, :except => [:host_authorization, :remote_token]
Sinatra::Application.set :host_authorization, { allowed_hosts: [nil] }

Dir[APP_ROOT.join('app', 'controllers', '*.rb')].each { |file| require file }
Dir[APP_ROOT.join('app', 'helpers', '*.rb')].each { |file| require file }

# Set up the database and models
require APP_ROOT.join('config', 'database')
