class JwtAuth

  def self.token(u)
    JWT.encode self.payload(u), ENV['JWT_SECRET'], 'HS256'
  end

  def self.payload(u)
     # {
     #    sub: u.id,
     #    exp: Time.now.to_i + 60 * 1440,
     #    iat: Time.now.to_i,
     #    iss: ENV['JWT_ISSUER'],
     #    user: {
     #      username: u.user_name,
     #      fullname: u.full_name,
     #      theme: u.theme
     #    }
     # }
     {
        sub: u.id,
        iat: Time.now.to_i,
        iss: ENV['JWT_ISSUER'],
        user: {
          username: u.user_name,
          fullname: u.full_name,
          theme: u.theme
        }
     }
  end

  def self.decode(token)
    options = { algorithm: 'HS256', iss: ENV['JWT_ISSUER'] }
    JWT.decode token, ENV['JWT_SECRET'], true, options
  end

end
