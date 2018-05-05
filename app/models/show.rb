class Show < ActiveRecord::Base

  validates :title, presence: true

  has_and_belongs_to_many :users
  has_many :seasons

  before_create :create_sort_name
  before_save :create_search_name

  scope :sorted_list, -> { order(:sort_name, :year) }

  def self.get_series(t)
    series = []
    new_t = URI.encode(t)

    series_response = JSON.parse(HTTParty.get('https://itunes.apple.com/search?term=' + t + '&media=tvShow&entity=tvSeason'))

      series_response['results'].each do |s|
        year = s['releaseDate'] != nil ? s['releaseDate'].split('-').slice(0,1).join() : ''
        rating = s['contentAdvisoryRating'] ? s['contentAdvisoryRating'] : ''
        details = {title: s['artistName'], collectionName: s['collectionName'], collectionId: s['collectionId'], season: get_season(s['collectionName']), poster: set_image(s['artworkUrl100']), rating: rating, year: year, plot: get_plot(s['longDescription']), genre: s['primaryGenreName']}
        series << details
      end

    if series.count == 0
      uri = URI.parse("https://api.thetvdb.com/refresh_token")
      request = Net::HTTP::Get.new(uri)
      request["Accept"] = "application/json"
      request["Authorization"] = "Bearer " + ENV['TVDB_TOKEN']

      req_options = {
        use_ssl: uri.scheme == "https",
      }

      token_response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
        http.request(request)
      end
      if token_response.code == '200'
        token_response = JSON.parse(token_response.body)

        uri = URI.parse("https://api.heroku.com/apps/mmdb-online/config-vars")
        request = Net::HTTP::Patch.new(uri)
        request.content_type = "application/json"
        request["Accept"] = "application/vnd.heroku+json; version=3"
        request["Authorization"] = "Bearer " + ENV['HEROKU_KEY']
        request.body = JSON.dump({
          'TVDB_TOKEN' => token_response['token']
        })

        req_options = {
          use_ssl: uri.scheme == "https",
        }

        response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
          http.request(request)
        end
      else
        uri = URI.parse("https://api.thetvdb.com/login")
        request = Net::HTTP::Post.new(uri)
        request.content_type = "application/json"
        request["Accept"] = "application/json"
        request["Authorization"] = "Bearer " + + ENV['TVDB_TOKEN']
        request.body = JSON.dump({
          "apikey" => ENV['TVDB_APIKEY'],
          "userkey" => ENV['TVDB_USERKEY'],
          "username" => ENV['TVDB_USERNAME']
        })

        req_options = {
          use_ssl: uri.scheme == "https",
        }

        token_response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
          http.request(request)
        end

        uri = URI.parse("https://api.heroku.com/apps/mmdb-online/config-vars")
        request = Net::HTTP::Patch.new(uri)
        request.content_type = "application/json"
        request["Accept"] = "application/vnd.heroku+json; version=3"
        request["Authorization"] = "Bearer " + ENV['HEROKU_KEY']
        request.body = JSON.dump({
          'TVDB_TOKEN' => token_response['token']
        })

        req_options = {
          use_ssl: uri.scheme == "https",
        }

        response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
          http.request(request)
        end
      end

      uri = URI.parse("https://api.thetvdb.com/search/series?name=" + URI.encode(t))
      request = Net::HTTP::Get.new(uri)
      request["Accept"] = "application/json"
      request["Authorization"] = "Bearer " + ENV['TVDB_TOKEN']

      req_options = {
        use_ssl: uri.scheme == "https",
      }

      first_response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
        http.request(request)
      end

      first_response = JSON.parse(first_response.body)

      first_response['data'].each do |s|
        uri = URI.parse("https://api.thetvdb.com/series/" + s['id'].to_s + "/episodes/summary")
        request = Net::HTTP::Get.new(uri)
        request["Accept"] = "application/json"
        request["Authorization"] = "Bearer " + ENV['TVDB_TOKEN']

        req_options = {
          use_ssl: uri.scheme == "https",
        }

        second_response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
          http.request(request)
        end
        second_response = JSON.parse(second_response.body)

        second_response['data']['airedSeasons'].delete('0') if second_response['data']['airedSeasons'].include?('0')

        second_response['data']['airedSeasons'].each do |a|
          season_number = second_response['data']['airedSeasons'].index(a) + 1
          new_t = URI.encode(t + ' season ' + season_number.to_s)
          doc = HTTParty.get('http://squaredtvart.tumblr.com/search/' + new_t)
          parsed_doc ||= Nokogiri::HTML(doc)
          p parsed_doc.css('p')[0].text.include?('No search')
          p poster = parsed_doc.css('img')[0]['src'].gsub(/_250.jpg/,'_1280.jpg')
          uri = URI.parse("https://api.thetvdb.com/series/" + s['id'].to_s + "/images/query?keyType=poster")
          request = Net::HTTP::Get.new(uri)
          request["Accept"] = "application/json"
          request["Authorization"] = "Bearer " + ENV['TVDB_TOKEN']

          req_options = {
            use_ssl: uri.scheme == "https",
          }

          third_response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
            http.request(request)
          end

          third_response = JSON.parse(third_response.body)
          poster = parsed_doc.css('p')[0].text.include?('No search') ? 'https://www.thetvdb.com/banners/' + third_response['data'][0]['fileName'] : parsed_doc.css('img')[0]['src'].gsub(/_250.jpg/,'_1280.jpg')
          year = s['firstAired'] != nil ? s['firstAired'].split('-').slice(0,1).join() : ''
          details = {title: s['seriesName'], collectionName: get_collection_name(s['seriesName'], season_number.to_s), collectionId: get_collection_id(s['id'], season_number.to_s), season: season_number.to_s, poster: poster, rating: '', year: year, plot: s['overview'], genre: ''}
          series << details
        end
      end
        return series.sort_by {|k| k[:season].to_i}
      # end
    else
      series.sort_by {|k| k[:year]}
    end
  end

  def self.get_episodes(id, season)
    episodes = []

    if id.include? 'tvdb'
      id = id.gsub(/tvdb/,'')
      id = id[0...-season.to_s.length]
      uri = URI.parse("https://api.thetvdb.com/series/" + id.to_s + "/episodes/query?airedSeason=" + season.to_s)
      request = Net::HTTP::Get.new(uri)
      request["Accept"] = "application/json"
      request["Authorization"] = "Bearer " + ENV['TVDB_TOKEN']

      req_options = {
        use_ssl: uri.scheme == "https",
      }

      first_response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
        http.request(request)
      end

      uri = URI.parse("https://api.thetvdb.com/series/" + id.to_s + "/images/query?keyType=fanart")
      request = Net::HTTP::Get.new(uri)
      request["Accept"] = "application/json"
      request["Authorization"] = "Bearer " + ENV['TVDB_TOKEN']

      req_options = {
        use_ssl: uri.scheme == "https",
      }

      second_response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
        http.request(request)
      end

      first_response = JSON.parse(first_response.body)
      second_response = JSON.parse(second_response.body)

      first_response['data'].each do |e|
        p preview = second_response['data'][0]['fileName'] ? 'https://www.thetvdb.com/banners/' + second_response['data'][0]['fileName'] : ''
        episode = {title: e['episodeName'], date: convert_date(e['firstAired']), plot: e['overview'], tv_episode: e['airedEpisodeNumber'], preview: preview}
        episodes << episode
      end
    else
      episodes_response = JSON.parse(HTTParty.get('https://itunes.apple.com/lookup?id=' + id + '&country=us&entity=tvEpisode'))
      return nil if episodes_response.length == 0

      episodes_response['results'].each do |e|
        episode = {title: e['trackName'], date: convert_date(e['releaseDate']), plot: e['longDescription'], runtime: e['trackTimeMillis'], tv_episode: e['trackNumber'], preview: e['previewUrl']}
        episodes << episode if e['trackId'] && e['trackNumber'].to_i < 100
      end
    end
    episodes.sort_by {|k| k[:tv_episode]}
  end

  def season_numbers
    numbers = []
    self.seasons.each {|s| numbers << s.season.to_i}
    numbers.sort.each_cons(2).all? { |x,y| y == x + 1 } && numbers.length == 3 || numbers.length == 4 ? numbers.sort.values_at(0,-1).join('–') : numbers.length < 5 ? numbers.sort.join(', ') : numbers.length
  end

  def episode_count
    episode_counts = []
    self.seasons.each {|s| episode_counts << s.episodes.count}
    episode_counts.inject(0, :+)
  end

  private

  def create_sort_name
    self.sort_name = self.title.gsub(/^(The\b*\W|A\b*\W|An\b*\W)/, '')
  end

  def create_search_name
    self.search_name = self.title.downcase
  end

  def self.set_image(p)
    # p.gsub!(/^(http)/, 'https')
    # p.gsub!(/(is\d)/, 'is5-ssl')
    p.gsub!(/100x100/, '600x600')
  end

  def self.get_plot(p)
    p.gsub!(/\<[i|b]\>|\<\/[i|b]\>/, '')
    p.gsub!(/\'/, '&#39;')
    p.gsub!(/\"/, '&#34;')
    p.gsub!(/\r|\n/, '')
    p.gsub!(/—|-/, '&#8211;')
  end

  def self.convert_date(d)
    date = DateTime.parse(d)
    new_date = date.strftime("%b %-d, %Y")
  end

  def self.get_season(s)
    s.gsub(/.*(Season\s)/) {''}
  end

  def self.get_collection_name(s, i)
    collection_name = s + ', Season ' + i
  end

  def self.get_collection_id(s, i)
    p collection_id = "tvdb#{s}#{i}"
  end
end
