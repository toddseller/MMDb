class JwtAuth


  def self.token(u)
    JWT.encode self.payload(u), ENV['JWT_SECRET'], 'HS256'
  end

  def self.payload(u)
     {
        exp: Time.now.to_i + 60 * 1440,
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

  def self.authenticate!
    # Extract <token> from the 'Bearer <token>' value of the Authorization header
    supplied_token = String(request.env['HTTP_AUTHORIZATION']).slice(7..-1)

    @auth_payload, @auth_header = JwtAuth.decode(supplied_token)

  rescue JWT::DecodeError => e
    halt 401, json(message: e.message)
  end

end