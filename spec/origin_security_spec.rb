require 'open3'

describe 'origin security' do
  describe 'error pages' do
    # Production runs as RACK_ENV=development, where Sinatra's default shows the exception page.
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
end
