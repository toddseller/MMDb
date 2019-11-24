class Show < ActiveRecord::Base

  validates :title, presence: true

  has_and_belongs_to_many :users
  has_many :seasons, -> { order(season: :asc) }

  accepts_nested_attributes_for :seasons

  before_create :create_sort_name
  before_save :create_search_name

  scope :sorted_list, -> { order(:sort_name, :year) }
  scope :recently_added, -> {order(created_at: :desc)}

  def self.get_series(t)
    series = []
    show_array =  Show.where("search_name LIKE ?", "%#{t}%").sorted_list
    if show_array.length > 0
      show_array.each do |show|
        show.seasons.each do |season|
          db_season = season.attributes.symbolize_keys
          db_season.store(:title, show.title)
          series << db_season
        end
      end
    end

    series_response = appletv_call(t)

    if series_response.length > 0
      series_response.each do |s|
        series << s if series.all? {|el| el[:collectionName] != s[:collectionName] && is_number?(s[:season])}
      end
    end

      if JwtAuth.has_expired?(ENV['TVDB_TOKEN'])
        token_response = tvdb_auth()
        heroku_call(token_response[:body]['token'])
      elsif JwtAuth.renew_token?(ENV['TVDB_TOKEN'])
        token_response = tvdb_call("https://api.thetvdb.com/refresh_token")
        heroku_call(token_response[:body]['token'])
      end

      first_response = tvdb_call("https://api.thetvdb.com/search/series?name=" + URI.encode(t))

      if first_response && first_response[:code] == '200'
        first_response[:body]['data'].each do |s|
          squared = true
          second_response = tvdb_call("https://api.thetvdb.com/series/" + s['id'].to_s + "/episodes/summary") if s['seriesName'] != nil && s['seriesName'].downcase == t.downcase
          second_response[:body]['data']['airedSeasons'].delete('0') if second_response && second_response[:body]['data']['airedSeasons'].include?('0')

          if second_response && second_response[:code] == '200'
            second_response[:body]['data']['airedSeasons'].each do |a|
              season_number = second_response[:body]['data']['airedSeasons'].index(a) + 1
              collection_name = get_collection_name(s['seriesName'], season_number.to_s)
              if series.all? {|el| el[:collectionName] != collection_name}
                if squared
                  new_t = URI.encode(t + ' season ' + season_number.to_s)
                  doc = HTTParty.get('http://squaredtvart.tumblr.com/search/' + new_t)
                  parsed_doc ||= Nokogiri::HTML(doc)
                  if !parsed_doc.css('p')[1].text.include?('No results')
                    poster = parsed_doc.css('a > img')[0]['src'].gsub(/_250.jpg/,'_1280.jpg')
                  else
                    poster = 'https://s3-us-west-2.amazonaws.com/toddseller/tedflix/imgs/Artboard+1-196x196.jpg'
                    squared = false
                  end
                else
                  poster = 'https://s3-us-west-2.amazonaws.com/toddseller/tedflix/imgs/Artboard+1-196x196.jpg'
                end
                year = s['firstAired'] != nil ? s['firstAired'].split('-').slice(0,1).join() : ''
                details = {title: s['seriesName'], collectionName: collection_name, collectionId: get_collection_id(s['id'], season_number.to_s), season: season_number.to_s, poster: poster, rating: '', year: year, plot: s['overview'], genre: ''}
                series << details if series.all? {|el| el[:collectionName] != collection_name}
              end
            end
          end
        end
      end
    series.sort {|a, b| [a[:title], a[:season].to_i] <=> [b[:title], b[:season].to_i]}
  end

  def self.get_episodes(id, season, skip, count)
    episodes = []
    if id.include? 'tvdb'
      id = id.gsub(/tvdb/,'')
      id = id[0...-season.to_s.length]

      get_runtime = tvdb_call("https://api.thetvdb.com/series/" + id.to_s)
      runtime = get_runtime[:body]['data']['runtime'].to_i * 1000 * 60

      first_response = tvdb_call("https://api.thetvdb.com/series/" + id.to_s + "/episodes/query?airedSeason=" + season.to_s)

      first_response[:body]['data'].each do |e|
        if e['firstAired'] != ''
          preview = "https://www.thetvdb.com/banners/episodes/" + id.to_s + "/" + e['id'].to_s + ".jpg"
          plot = e['overview'] ? get_plot(e['overview']) : ''
          episode = {title: e['episodeName'], date: convert_date(e['firstAired']), plot: plot, runtime: runtime, tv_episode: e['airedEpisodeNumber'], preview: preview}
          episodes << episode if !Date.parse(e['firstAired']).future?
        end
      end
    else
      episodes_response = HTTParty.get('https://tv.apple.com/api/uts/v2/view/show/' + id + '/episodes?skip=' + skip + '&count=' + count + '&sf=143441&locale=EN&utsk=0&caller=wta&v=36&pfm=web')
      return nil if episodes_response.length == 0

      episodes_response['data']['episodes'].each do |e|
        poster = e['images']['previewFrame']['url'].gsub(/({w}x{h}.{f})/, '300x169.jpg')
        episode = {title: e['title'], date: Time.at(e['releaseDate'] / 1000).to_datetime.strftime("%b %-d, %Y"), plot: e['description'], runtime: e['duration'] * 1000, tv_episode: e['episodeNumber'], preview: poster}
        episodes << episode
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
    self.search_name = self.title.downcase if self.title != 'M*A*S*H'
  end

  def self.set_image(p)
    p.gsub!(/100x100/, '600x600')
  end

  def self.get_plot(p)
    new_p = p.gsub(/\<[i|b]\>|\<\/[i|b]\>/, '')
    new_p = new_p.gsub(/\'/, '&#39;')
    new_p = new_p.gsub(/\"/, '&#34;')
    new_p = new_p.gsub(/\r|\n/, '')
    new_p = new_p.gsub(/—|-/, '&#8211;')
    new_p = new_p.gsub(/\"\"/, '&#34;')
  end

  def self.convert_date(d)
    date = DateTime.parse(d)
    new_date = date.strftime("%b %-d, %Y")
  end

  def self.get_season(s)
    new_s = s.gsub(/.*(Season\s)/) {''}
    new_s = new_s.gsub(/.*(Series\s)/) {''}
    new_s = new_s.gsub(/\W.*/) {''}
  end

  def self.get_collection_name(s, i)
    collection_name = s + ', Season ' + i if s != nil && i != nil
  end

  def self.get_collection_id(s, i)
    collection_id = "tvdb#{s}#{i}"
  end

  def self.tvdb_auth
    uri = URI.parse("https://api.thetvdb.com/login")
    request = Net::HTTP::Post.new(uri)
    request.content_type = "application/json"
    request["Accept"] = "application/json"
    request.body = JSON.dump({
      "apikey" => ENV['TVDB_APIKEY'],
      "userkey" => ENV['TVDB_USERKEY'],
      "username" => ENV['TVDB_USERNAME']
    })

    req_options = {
      use_ssl: uri.scheme == "https",
    }

    response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
      http.request(request)
    end
    response = {code: response.code, body: JSON.parse(response.body)}
  end

  def self.tvdb_call(url)
    uri = URI.parse(url)
    request = Net::HTTP::Get.new(uri)
    request["Accept"] = "application/json"
    request["Authorization"] = "Bearer " + ENV['TVDB_TOKEN']


    req_options = {
      use_ssl: uri.scheme == "https",
    }

    response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
      http.request(request)
    end
    response = {code: response.code, body: JSON.parse(response.body)}
  end

  def self.heroku_call(token)
    uri = URI.parse("https://api.heroku.com/apps/mmdb-online/config-vars")
    request = Net::HTTP::Patch.new(uri)
    request.content_type = "application/json"
    request["Accept"] = "application/vnd.heroku+json; version=3"
    request["Authorization"] = "Bearer " + ENV['HEROKU_KEY']
    request.body = JSON.dump({
      'TVDB_TOKEN' => token
    })

    req_options = {
      use_ssl: uri.scheme == "https",
    }

    response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
      http.request(request)
    end
    response.code
  end

  def self.appletv_call(s_term)
    details = []
    response = HTTParty.get('https://tv.apple.com/api/uts/v2/uts/v2/search/incremental?sf=143441&locale=EN&utsk=0&caller=wta&v=36&pfm=web&q=' + s_term)

    response['data']['canvas']['shelves'].each do |show|
      show['items'].each do |s|
        i = 0
        startCount = 0
        if s['type'] == 'Show'
          request1 = HTTParty.get('https://tv.apple.com/api/uts/v2/view/show/' + s['id'] + '?sf=143441&locale=EN&utsk=0&caller=wta&v=36&pfm=web')
          title =  request1['data']['content']['title']
          description = request1['data']['content']['description']
          genre = request1['data']['content']['genres'] ? request1['data']['content']['genres'][0]['name'] : ''
          rating = request1['data']['content']['rating'] ? request1['data']['content']['rating']['displayName'] : ''
          date = request1['data']['content']['releaseDate'] ? Time.at(request1['data']['content']['releaseDate'] / 1000).to_datetime.year.to_s : ''

          request2 = HTTParty.get('https://tv.apple.com/api/uts/v2/view/show/' + s['id'] + '/episodes?sf=143441&locale=EN&utsk=0&caller=wta&v=36&pfm=web')

          if request2['data']['seasonSummaries']
            request2['data']['seasonSummaries'].each do |season|
              collectionName = title + ', ' + season['label']
              collectionId = request2['data']['seasons'][i]['id']
              poster = request2['data']['seasons'][i]['images'] && request2['data']['seasons'][i]['images']['coverArt'] ? request2['data']['seasons'][i]['images']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg') : request2['data']['seasons'][i]['showImages']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg')
              seasonNumber = request2['data']['seasons'][i]['seasonNumber'].to_s
              skip = seasonNumber == '1' ? 0 : startCount
              details << {appleTvId: s['id'], title: title, collectionName: collectionName, collectionId: collectionId, season: seasonNumber, rating: rating, genre: genre, plot: get_plot(description), year: date, poster: poster, skip: skip, count: season['episodeCount']}
              i += 1
              startCount += season['episodeCount']
            end
          else
            collectionName = request2['data']['episodes'][0]['title'] + ', Season 1'
            collectionId = request2['data']['episodes'][0]['id']
            poster = request2['data']['episodes'][0]['images'] && request2['data']['episodes'][0]['images']['coverArt'] ? request2['data']['episodes'][0]['images']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg') : request2['data']['episodes'][0]['showImages']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg')
            seasonNumber = '1'
            details << {appleTvId: s['id'], title: title, collectionName: collectionName, collectionId: collectionId, season: seasonNumber, rating: rating, genre: genre, plot: get_plot(description), year: date, poster: poster, skip: 0, count: 1}
          end
        end
      end
    end
    return details
  end

  def self.is_number?(string)
    true if Float(string) rescue false
  end

end
