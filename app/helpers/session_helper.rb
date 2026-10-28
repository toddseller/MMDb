# Reading the session makes Rack send a cookie back, so requests that arrive without one (toddseller.com's API calls) are left alone.
before { refresh_session if request.cookies.key?('rack.session') }

helpers do
  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  # Visitors, and any value the stylesheet doesn't know, get System.
  def page_theme
    User::THEMES.include?(session[:theme]) ? session[:theme] : 'system'
  end

  def require_sign_in!
    halt 401 unless current_user
  end

  # The URL's user must be the signed-in one; an existing movie or show must also be in their collection.
  def require_owner!(collection = nil, id = nil)
    require_sign_in!
    halt 403 unless current_user.id == params[:user_id].to_i && (collection.nil? || current_user.public_send(collection).exists?(id))
  end

  # The API's version of require_owner!: the token's user must have the movie or show in their collection.
  def require_api_owner!(collection, id)
    halt 403, json(message: 'That is not in your collection.') unless User.find(@auth_payload['sub']).public_send(collection).exists?(id)
  end

  def sign_out!
    session[:user_id] = nil
    session[:name] = nil
    session[:theme] = 'system'
    session.delete(:expires_at)
    session.delete(:remember)
  end

  # Templates read the session directly, so this runs before every route rather than inside current_user.
  # A session with no end time yet (from before expiry existed, registering, or the API logins) starts its first one here.
  def refresh_session
    return unless session[:user_id]
    return sign_out! if session[:expires_at] && session[:expires_at] < Time.now.to_i
    extend_session
  end

  def extend_session
    lifetime = session[:remember] ? JwtAuth::REMEMBERED_LIFETIME : JwtAuth::SESSION_LIFETIME
    session[:expires_at] = Time.now.to_i + lifetime
    request.session_options[:expire_after] = lifetime
    # Per request, not global: a global secure makes Rack drop the cookie on plain HTTP, which local runs and the tests use.
    request.session_options[:secure] = request.ssl?
  end
end
