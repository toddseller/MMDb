class Show < ActiveRecord::Base

  validates :title, presence: true

  has_and_belongs_to_many :users
  has_many :seasons, -> { order(season: :asc) }

  accepts_nested_attributes_for :seasons

  before_create :create_sort_name
  before_save :create_search_name
  before_save :add_season_count

  scope :sorted_list, -> { order(:sort_name, :year) }
  scope :recently_added, -> {order(created_at: :desc)}

  def self.get_series(t)
    series = []
    show_array =  Show.where("search_name LIKE ?", "%#{t}%").sorted_list
    if show_array.length > 0
      show_array.each do |show|
        show.seasons
        show.seasons.each do |season|
          db_season = season.attributes.symbolize_keys
          db_season.store(:title, show.title)
          if season[:appleTvId] != nil && season[:appleTvId] != ""
            storeId = season[:storeId] ? season[:storeId] : '143441'
            request = HTTParty.get('https://tv.apple.com/api/uts/v2/view/show/' + season[:appleTvId] + '/episodes?sf=' + storeId +'&locale=en-US&utsk=0&caller=wta&v=36&pfm=desktop')
            db_season[:storeId] = storeId if db_season[:storeId] == nil
            db_season[:count] = request['data']['seasonSummaries'][season[:season] - 1]['episodeCount'].to_s
          end
          db_season[:show_collection_id] = show[:show_collection_id]
          db_season[:year] = show[:year]
          series << db_season
        end
      end
    end

    series_response = appletv_call(t)

    if series_response.length > 0
      series_response.each do |s|
        series << s if series.all? {|el| el[:collectionName].downcase != s[:collectionName].downcase || el[:show_collection_id] != s[:show_collection_id] && is_number?(s[:season])}
      end
    end

    if JwtAuth.has_expired?(ENV['TVDB_TOKEN'])
      token_response = tvdb_auth()
      ENV['TVDB_TOKEN'] = token_response[:body]['data']['token']
    end

    
    first_response = tvdb_call("https://api4.thetvdb.com/v4/search?query=" + URI.encode(t) + "&type=series&limit=1")
    if first_response && first_response[:code] == '200'
      first_response[:body]['data'].each do |s|
        squared = true
        second_response = tvdb_call("https://api4.thetvdb.com/v4/series/" + s['tvdb_id'].to_s + "/extended?meta=translations&short=true")
        aired_seasons = []
        if !second_response[:body].nil? || !second_response[:body].empty? && second_response[:code] == '200'
          second_response[:body]['data']['seasons'].each do |sea|
            aired_seasons << sea['number'] if sea['number'] != 0 && sea['type']['type'] == 'official'
          end
          aired_seasons.each do |a|
            season_number = a
            collection_name = get_collection_name(s['name'], season_number.to_s)
            if series.all? {|el| el[:collectionName] != collection_name}
              if squared
                new_t = URI.encode(t + ' season ' + season_number.to_s)
                doc = HTTParty.get('http://squaredtvart.tumblr.com/search/' + new_t)
                parsed_doc ||= Nokogiri::HTML(doc)
                if !parsed_doc.css('p')[1].text.include?('No results')
                  poster = parsed_doc.css('a > img')[0]['src'].gsub(/_250.jpg/,'_1280.jpg')
                else
                  poster = s['image_url']
                  squared = false
                end
              else
                poster = 'https://s3-us-west-2.amazonaws.com/toddseller/tedflix/imgs/Artboard+1-196x196.jpg'
              end
              overview = second_response[:body]['data'].has_key?('overviewTranslations') || second_response[:body]['data'].has_key?(:overviewTranslations) ? get_overview(second_response[:body]['data']['translations']['overviewTranslations']) : ''
              year = s.has_key?('year') && s['year'] != nil ? s['year'] : ''
              genre = second_response[:body]['data'].has_key?('genres') && second_response[:body]['data']['genres'].length != 0 ? second_response[:body]['data']['genres'][0]['name'] : ''
              rating = second_response[:body]['data'].has_key?('contentRatings') || second_response[:body]['data'].has_key?(:contentRatings) ? get_ratings(second_response[:body]['data']['contentRatings']) : ''
              details = {title: s['name'], collectionName: collection_name, collectionId: get_collection_id(s['tvdb_id'], season_number.to_s), season: season_number.to_s, poster: poster, rating: rating, year: year, plot: overview, genre: genre, show_collection_id: s['tvdb_id']}
              series << details if series.all? {|el| el[:collectionName].downcase != collection_name.downcase}
            end
          end
        end
      end
    end
    
    series.sort {|a, b| [a[:year], a[:title], a[:season].to_i] <=> [b[:year], b[:title], b[:season].to_i]}
  end

  def self.get_episodes(id, season, skip=0, count=0, storeId='143441')
    episodes = []
    if id.include? 'tvdb'
      id = id.gsub(/tvdb/,'')
      id = id[0...-season.to_s.length]
      p first_response = tvdb_call("https://api4.thetvdb.com/v4/series/" + id.to_s + "/episodes/official?page=0&season=" + season.to_s)
      first_response[:body]['data']['episodes'].each do |e|
        if e['aired'] != ''
          preview = e['image'] ? e['image'] : ''
          plot = e.has_key?('overview') || e.has_key?(:overview) ? get_plot(e['overview']) : ''
          runtime = e['runtime'] ? e['runtime'].to_s : ''
          episode = {title: e['name'], date: convert_date(e['aired']), plot: plot, runtime: runtime, tv_episode: e['number'], preview: preview}
          episodes << episode if e['aired'] != nil && !Date.parse(e['aired']).future?
        end
      end
    else
      episodes_response = HTTParty.get('https://tv.apple.com/api/uts/v2/view/show/' + id + '/episodes?skip=' + skip + '&count=' + count + '&sf=' + storeId + '&locale=en-US&utsk=0&caller=wta&v=36&pfm=desktop')
      return nil if episodes_response.length == 0

      episodes_response['data']['episodes'].each do |e|
        poster = e['images']['previewFrame'] ? e['images']['previewFrame']['url'].gsub(/({w}x{h}.{f})/, '300x169.jpg') : e['showImages']['keyframe']['url'].gsub(/({w}x{h}.{f})/, '300x169.jpg')
        date = e['releaseDate'] ? Time.at(e['releaseDate'] / 1000).to_datetime.strftime("%b %-d, %Y") : ''
        runtime = e['duration'] ? e['duration'] / 60 : ''
        episode = {title: clean_up_title(e['title']), date: date, plot: e['description'], runtime: runtime, tv_episode: e['episodeNumber'], preview: poster}
        episodes << episode if e['episodeNumber'] != nil
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

  def self.basic_info(u)
    shows_list = []
    u.shows.sorted_list.each{ |show| shows_list << {id: show.id, title: show.title, sort_name: show.sort_name, search_name: show.search_name, poster: show.poster, seasonNumbers: show.seasonNumbers, seasonCount: show.seasonCount}}
    shows_list
  end

  private

  def create_sort_name
    self.sort_name = self.title.gsub(/^(The\b*\W|A\b*\W|An\b*\W)/, '')
  end

  def create_search_name
    self.search_name = self.title.downcase if self.title != 'M*A*S*H'
  end

  def add_season_count
    self.seasonNumbers = self.season_numbers.to_s
    self.seasonCount = self.seasons.count.to_s
  end

  def self.set_image(p)
    p.gsub!(/100x100/, '600x600')
  end

  def self.get_plot(p)
    return if p == nil
    new_p = p.gsub(/\<[i|b]\>|\<\/[i|b]\>/, '')
    new_p = new_p.gsub(/\'/, '&#39;')
    new_p = new_p.gsub(/\"/, '&#34;')
    new_p = new_p.gsub(/\r|\n/, '')
    new_p = new_p.gsub(/—|-/, '&#8211;')
    new_p = new_p.gsub(/\"\"/, '&#34;')
  end

  def self.convert_date(d)
    if d != nil
      date = DateTime.parse(d)
      new_date = date.strftime("%b %-d, %Y")
    else
      ''
    end
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

  def self.clean_up_title(t)
    new_t = t.gsub(/\"/, '')
  end

  def self.get_ratings(s)
    if !s.empty?
      rating = s.select { |rating| rating['country'] == 'usa' }
      if !rating.empty?
        rating[0]['name']
      else
        ''
      end
    else
      ''
    end
  end

  def self.get_overview(s)
    if s != nil
      overview = s.select { |overview| overview['language'] == 'eng' }
      # overview[0]['language'] == 'eng' ? overview[0]['overview'] : ''
      overview.length != 0 ? overview[0]['overview'] : ''
    else
      ''
    end
  end

  def self.tvdb_auth
    uri = URI.parse("https://api4.thetvdb.com/v4/login")
    request = Net::HTTP::Post.new(uri)
    request.content_type = "application/json"
    request["Accept"] = "application/json"
    request.body = JSON.dump({
      "apikey" => ENV['TVDB_APIKEY'],
      "pin" => ENV['TVDB_PIN']
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
    if !response.body.nil? || !response.body.empty?
      response = {code: response.code, body: JSON.parse(response.body)}
    end
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
    storeIds = ['143444', '143455', '143460']
    storeIds.each do |store|
      response = HTTParty.get('https://uts-api.itunes.apple.com/uts/v2/search/incremental?sf=' + store + '&locale=en-US&utsk=0&caller=wta&v=36&pfm=desktop&q=' + URI.encode(s_term))

      if response['data']['canvas'] != nil
        response['data']['canvas']['shelves'].each do |show|
          show['items'].each do |s|
            i = 0
            startCount = 0

            if s['type'] == 'Show' && s['title'] && s['title'].downcase() == s_term.downcase()
              request1 = HTTParty.get('https://uts-api.itunes.apple.com/uts/v2/view/show/' + s['id'] + '?sf=' + store + '&locale=en-US&utsk=0&caller=wta&v=36&pfm=desktop')
              p title =  request1['data']['content']['title']
              description = request1['data']['content']['description']
              genre = request1['data']['content']['genres'] ? request1['data']['content']['genres'][0]['name'] : ''
              rating = request1['data']['content']['rating'] ? request1['data']['content']['rating']['displayName'] : ''
              date = request1['data']['content']['releaseDate'] ? Time.at(request1['data']['content']['releaseDate'] / 1000).to_datetime.year.to_s : ''
              show_collection_id = s['id']
              p request2 = HTTParty.get('https://uts-api.itunes.apple.com/uts/v2/view/show/' + s['id'] + '/episodes?sf=' + store + '&locale=en-US&utsk=0&caller=wta&v=36&pfm=desktop')

              if request2['data']['seasonSummaries']
                request2['data']['seasonSummaries'].each do |season|
                  collectionName = title + ', ' + season['label']
                  collectionId = request2['data']['seasons'][i]['id']
                  get_plot(description)
                  poster = request2['data']['seasons'][i]['images'] && request2['data']['seasons'][i]['images']['coverArt'] ? request2['data']['seasons'][i]['images']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg') : request2['data']['seasons'][i]['showImages'] && request2['data']['seasons'][i]['showImages']['coverArt'] ? request2['data']['seasons'][i]['showImages']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg') : 'https://s3-us-west-2.amazonaws.com/toddseller/tedflix/imgs/Artboard+1-196x196.jpg'
                  seasonNumber = request2['data']['seasons'][i]['seasonNumber'].to_s
                  skip = seasonNumber == '1' ? 0 : startCount
                  # details << {appleTvId: s['id'], title: title, collectionName: collectionName, collectionId: collectionId, season: seasonNumber, rating: rating, genre: genre, plot: get_plot(description), year: date, poster: poster, skip: skip, count: season['episodeCount'], storeId: store}
                  details << {appleTvId: s['id'], title: title, collectionName: collectionName, collectionId: collectionId, season: seasonNumber, rating: rating, genre: genre, plot: get_plot(description), year: date, poster: poster, skip: skip, count: season['episodeCount'], storeId: store, show_collection_id: s['id']}
                  i += 1
                  startCount += season['episodeCount']
                end
              else
                collectionName = request2['data']['episodes'][0]['title'] + ', Season 1'
                collectionId = request2['data']['episodes'][0]['id']
                poster = request2['data']['episodes'][0]['images'] && request2['data']['episodes'][0]['images']['coverArt'] ? request2['data']['episodes'][0]['images']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg') : request2['data']['episodes'][0]['showImages'] && request2['data']['episodes'][0]['showImages']['coverArt'] ? request2['data']['episodes'][0]['showImages']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg') : 'https://s3-us-west-2.amazonaws.com/toddseller/tedflix/imgs/Artboard+1-196x196.jpg'
                seasonNumber = '1'
                details << {appleTvId: s['id'], title: title, collectionName: collectionName, collectionId: collectionId, season: seasonNumber, rating: rating, genre: genre, plot: get_plot(description), year: date, poster: poster, skip: 0, count: 1, storeId: store, show_collection_id: s['id']}
              end
            end
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
