# Drives the real Rack app from config.ru, so session and view settings match production.
module RequestHelper
  APP = Rack::Builder.parse_file(APP_ROOT.join('config.ru').to_s)

  def get(path, **opts)
    request('GET', path, **opts)
  end

  def post(path, **opts)
    request('POST', path, **opts)
  end

  # Production's request body can't be rewound, unlike Rack::MockRequest's StringIO; once: matches production.
  ReadOnce = Struct.new(:io) do
    def read(*args) = io.read(*args)
    def gets = io.gets
    def each(&block) = io.each(&block)
    def size = io.size
  end

  # env takes Rack keys, such as 'HTTP_AUTHORIZATION'.
  def request(method, path, params: {}, json: nil, env: {}, xhr: true, once: false)
    env = env.merge(method: method, params: params)
    env.merge!(input: json.to_json, 'CONTENT_TYPE' => 'application/json') if json
    env[:input] = ReadOnce.new(StringIO.new(env[:input])) if once && env[:input]
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
