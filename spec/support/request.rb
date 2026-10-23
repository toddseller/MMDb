# Drives the real Rack app from config.ru, so session and view settings match production.
module RequestHelper
  APP = Rack::Builder.parse_file(APP_ROOT.join('config.ru').to_s)

  def get(path, **opts)
    request('GET', path, **opts)
  end

  def post(path, **opts)
    request('POST', path, **opts)
  end

  def request(method, path, params: {}, xhr: true)
    env = { method: method, params: params }
    env['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest' if xhr
    env['HTTP_COOKIE'] = @cookie if @cookie
    response = Rack::MockRequest.new(APP).request(method, path, env)
    @cookie = response['set-cookie'].split(';').first if response['set-cookie']
    response
  end

  def log_in(user, password)
    post('/sessions', params: { username_email: user.email, password: password })
  end
end

RSpec.configure { |config| config.include RequestHelper }
