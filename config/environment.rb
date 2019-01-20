# Set up gems listed in the Gemfile.
# See: http://gembundler.com/bundler_setup.html
#      http://stackoverflow.com/questions/7243486/why-do-you-need-require-bundler-setup
ENV['BUNDLE_GEMFILE'] ||= File.expand_path('../../Gemfile', __FILE__)

require 'bundler/setup' if File.exists?(ENV['BUNDLE_GEMFILE'])

# Require gems we care about
require 'rubygems'

require 'uri'
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
require 'tilt/erb'
require 'rack/cors'
require 'jwt'

require 'dotenv'
Dotenv.load

require 'erb'
require 'bcrypt'
require 'httparty'
require 'nokogiri'

# Some helper constants for path-centric logic
APP_ROOT = Pathname.new(File.expand_path('../../', __FILE__))

APP_NAME = APP_ROOT.basename.to_s

# Set up the controllers and helpers
Dir[APP_ROOT.join('app', 'controllers', '*.rb')].each { |file| require file }
Dir[APP_ROOT.join('app', 'helpers', '*.rb')].each { |file| require file }

# Set up the database and models
require APP_ROOT.join('config', 'database')
