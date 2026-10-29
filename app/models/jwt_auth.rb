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
        pwd: u.password_fingerprint,
        user: {
          username: u.user_name,
          fullname: u.full_name
        }
     }
  end

  def self.decode(token)
    # Requiring exp rejects every token issued before expiry existed, whatever secret signed it.
    options = { algorithm: 'HS256', iss: ENV['JWT_ISSUER'], verify_iss: true, required_claims: ['exp'] }
    decoded = JWT.decode token, ENV['JWT_SECRET'], true, options
    # A token from before the user's latest password change, or from before tokens recorded it, no longer counts.
    payload = decoded.first
    user = User.find_by(id: payload['sub'])
    raise JWT::DecodeError, 'Sign in again' unless user && user.password_fingerprint == payload['pwd']
    decoded
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
