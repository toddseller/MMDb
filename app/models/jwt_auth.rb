class JwtAuth

  def self.token(u)
    JWT.encode self.payload(u), ENV['JWT_SECRET'], 'HS256'
  end

  def self.payload(u)
     {
        exp: Time.now.to_i + 60,
        iat: Time.now.to_i,
        iss: ENV['JWT_ISSUER'],
        user: {
          username: u.user_name,
          fullname: u.full_name
        }
     }
  end

  def self.decode(token)
    options = { algorithm: 'HS256', iss: ENV['JWT_ISSUER'] }
    JWT.decode token, ENV['JWT_SECRET'], true, options
  end

  private
  def http_token
    @http_token ||= if request.headers['Authorization'].present?
      request.headers['Authorization'].split(' ').last
    end
  end
  # def call env
  #   begin
  #     options = { algorithm: 'HS256', iss: ENV['JWT_ISSUER'] }
  #     bearer = env.fetch('HTTP_AUTHORIZATION', '').slice(7..-1)
  #     payload, header = JWT.decode bearer, ENV['JWT_SECRET'], true, options
  #
  #     env[:scopes] = payload['scopes']
  #     env[:user] = payload['user']
  #
  #     @app.call env
  #   rescue JWT::DecodeError
  #     [401, { 'Content-Type' => 'text/plain' }, ['A token must be passed.']]
  #   rescue JWT::ExpiredSignature
  #     [403, { 'Content-Type' => 'text/plain' }, ['The token has expired.']]
  #   rescue JWT::InvalidIssuerError
  #     [403, { 'Content-Type' => 'text/plain' }, ['The token does not have a valid issuer.']]
  #   rescue JWT::InvalidIatError
  #     [403, { 'Content-Type' => 'text/plain' }, ['The token does not have a valid "issued at" time.']]
  #   end
  # end
end