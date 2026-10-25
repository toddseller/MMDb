helpers do
  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def require_sign_in!
    halt 401 unless current_user
  end

  # The URL's user must be the signed-in one; an existing movie or show must also be in their collection.
  def require_owner!(collection = nil, id = nil)
    require_sign_in!
    halt 403 unless current_user.id == params[:user_id].to_i && (collection.nil? || current_user.public_send(collection).exists?(id))
  end
end
