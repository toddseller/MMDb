require 'open3'
require 'puma'
require 'puma/configuration'

describe 'origin security' do
  describe 'error pages' do
    # Sinatra's default shows the exception page in development, which local Docker runs use.
    around do |example|
      environment = Sinatra::Application.environment
      Sinatra::Application.set :environment, :development
      example.run
    ensure
      Sinatra::Application.set :environment, environment
    end

    it 'never shows the exception page' do
      expect(Sinatra::Application.show_exceptions?).to be false
    end
  end

  describe 'signing secrets' do
    # An empty value, unlike an unset one, is never filled in from a local .env.
    def boot(env)
      Open3.capture2e(env, RbConfig.ruby, '-e', "require './config/environment'", chdir: APP_ROOT.to_s)
    end

    %w[SESSION_SECRET JWT_SECRET].each do |name|
      it "refuses to start without #{name}" do
        output, status = boot(name => '')
        expect(status.success?).to be false
        expect(output).to include name
      end
    end

    it 'starts with both secrets set' do
      output, status = boot({})
      expect(status.success?).to be(true), output
    end
  end

  # Production traffic arrives through the Cloudflare tunnel over the Docker network, never the host port.
  it 'publishes the web port on loopback only' do
    compose = YAML.safe_load_file(APP_ROOT.join('docker-compose.yml'))
    expect(compose['services']['web']['ports']).to eq ['127.0.0.1:4666:4666']
  end

  # The server's .env says production; a machine whose .env doesn't say otherwise runs as development.
  it 'takes RACK_ENV from each machine' do
    compose = YAML.safe_load_file(APP_ROOT.join('docker-compose.yml'))
    expect(compose['services']['web']['environment']).to include 'RACK_ENV=${RACK_ENV:-development}'
  end

  # The server's logs are read with `docker logs`, so production must not move them into files.
  it 'keeps Puma output on stdout in production' do
    rack_env = ENV['RACK_ENV']
    ENV['RACK_ENV'] = 'production'
    config = Puma::Configuration.new(config_files: [APP_ROOT.join('config', 'puma.rb').to_s])
    config.clamp
    expect(config.options[:redirect_stdout]).to be_nil
  ensure
    ENV['RACK_ENV'] = rack_env
  end
end
