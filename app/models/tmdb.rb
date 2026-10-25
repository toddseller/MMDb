module Tmdb
  BASE = 'https://api.themoviedb.org/3/'

  def self.get(path, params = {})
    uri = URI(BASE + path)
    uri.query = URI.encode_www_form(params) unless params.empty?
    request = Net::HTTP::Get.new(uri)
    request['Accept'] = 'application/json'
    request['Authorization'] = 'Bearer ' + ENV['TMDB_TOKEN']
    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }
    { code: response.code, body: JSON.parse(response.body) }
  end
end
