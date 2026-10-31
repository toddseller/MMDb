get '/users' do
  @users = User.all
  @movies = Movie.all
  erb :'users/index'
end

get '/users/new' do
  erb :'users/new'
end

post '/users' do
  @user = User.create((params[:user] || {}).merge(theme: 'system'))
  if @user.valid?
    session[:user_id] = @user.id
    session[:password_fingerprint] = @user.password_fingerprint
    session[:name] = @user.full_name
    redirect '/users'
  else
    redirect "/users/new?errors=#{@user.errors.full_messages.join(" and ")}"
  end
end

helpers do
  def movies_page(user)
    @user = user
    @my_movies = @user.movies.sorted_list
    @shows = @user.shows
    @count = @my_movies.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\1,').reverse
    if request.xhr?
      page = erb :'/movies/show', layout: false
      movie_count = @user.movies.count.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\1,').reverse
      json status: "true", page: page, movie_count: movie_count
    else
      erb :'/users/show'
    end
  end

  # Relative, unlike Sinatra's redirect, so the address never depends on how the tunnel reports the request's scheme.
  def moved_to(path) = halt(301, { 'location' => path }, '')

  # A handle its owner has since changed redirects to their current one, so a shared link never reaches someone else.
  def collection_owner(handle, page = '')
    User.find_by(handle: handle) || moved_to("/u/#{UserHandle.find_by(handle: handle)&.user&.handle || halt(404)}#{page}")
  end

  # Bookmarks and shared links from before handles; the page's own background requests are answered where they are.
  def redirect_page_to_handle(user, page = '')
    moved_to("/u/#{user.handle}#{page}#{"?#{request.query_string}" unless request.query_string.empty?}") unless request.xhr?
  end
end

get '/u/:handle' do
  movies_page(collection_owner(params[:handle]))
end

get '/users/:id' do
  user = User.find(params[:id])
  redirect_page_to_handle(user)
  movies_page(user)
end

get '/users/:id/edit' do
  @user = current_user
  erb :'/partials/_edit_user', layout: false, locals: {user: @user}
end

put '/users/:id' do
  require_sign_in!
  halt 403 unless current_user.id == params[:id].to_i
  @user = current_user
  if params[:current] == ''
    saved = @user.update(first_name: params[:first_name], last_name: params[:last_name], user_name: params[:user_name], handle: params.fetch(:handle, @user.handle), email: params[:email], theme: params[:theme], password_hash: @user.password_hash)
  elsif @user.authenticate(params[:current])
    saved = @user.update(first_name: params[:first_name], last_name: params[:last_name], user_name: params[:user_name], handle: params.fetch(:handle, @user.handle), email: params[:email], theme: params[:theme], password: params[:password])
  end
  # A refused update still holds the refused values, so nothing of it may reach the session.
  if saved
    session[:password_fingerprint] = @user.password_fingerprint
    session[:name] = @user.full_name
    session[:theme] = @user.theme
    json status: "true", name: @user.full_name, theme: @user.theme
  else
    json status: "false"
  end
end
