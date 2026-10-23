class JwtAuth

  REMEMBERED_LIFETIME = 30 * 86_400
  SESSION_LIFETIME = 86_400

  def self.token(u, lifetime:)
    JWT.encode self.payload(u, lifetime), ENV['JWT_SECRET'], 'HS256'
  end

  def self.payload(u, lifetime)
     now = Time.now.to_i
     {
        sub: u.id,
        iat: now,
        exp: now + lifetime,
        iss: ENV['JWT_ISSUER'],
        user: {
          username: u.user_name,
          fullname: u.full_name
        }
     }
  end

  def self.decode(token)
    # Requiring exp rejects every token issued before expiry existed, whatever secret signed it.
    options = { algorithm: 'HS256', iss: ENV['JWT_ISSUER'], verify_iss: true, required_claims: ['exp'] }
    JWT.decode token, ENV['JWT_SECRET'], true, options
  end

  def self.has_expired?(token)
    now = Time.now.to_i
    payload, header = JWT.decode token, nil, false

    payload['exp'] < now
  end

  def self.renew_token?(token)
    now = Time.now.to_i
    payload, header = JWT.decode token, nil, false

    payload['exp'] - 1200 <= now
  end

end
