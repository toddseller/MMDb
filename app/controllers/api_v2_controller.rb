namespace '/api/v2' do
  before do
    content_type 'application/json'
  end

  get '/movies' do
    user = User.find(params[:user_key])
    user.movies.sorted_list.to_json
  end

end