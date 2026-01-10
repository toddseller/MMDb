class Show < ActiveRecord::Base

  self.per_page = 50

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
            request['data']['seasonSummaries']
            db_season[:storeId] = storeId if db_season[:storeId] == nil
            db_season[:count] = request['data']['seasonSummaries'][season[:season] - 1]['episodeCount'].to_s if request['data']['seasonSummaries'] != nil
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

    tmdb_response = tmdb_call(t)

    if tmdb_response.length > 0
      tmdb_response.each do |s|
        series << s if series.all? {|el| el[:collectionName].downcase != s[:collectionName].downcase}
      end
    end
    series.sort {|a, b| [a[:year], a[:title], a[:season].to_i] <=> [b[:year], b[:title], b[:season].to_i]}
  end

  def self.get_episodes(id, season, skip=0, count=0, storeId='143441')
    episodes = []
    if id.include? 'tvdb'
      id = id.gsub(/tvdb/,'')
      id = id[0...-season.to_s.length]
      tvdb_episodes = tvdb_episodes(id, season)

      if tvdb_episodes.length > 0
        tvdb_episodes.each do |e|
          episodes << e if e[:tv_episode] != nil
        end
      end
    elsif id.include? 'tmdb'
      id = id.gsub(/tmdb/,'')
      id = id[0...-season.to_s.length]
      tmdb_episodes = tmdb_episodes(id, season)

      if tmdb_episodes.length > 0
        tmdb_episodes.each do |e|
          episodes << e if e[:tv_episode] != nil
        end
      end
    else
      episode_response = appletv_episodes(id, skip, count, storeId)

      if episode_response.length > 0
        episode_response.each do |e|
          episodes << e if e[:tv_episode] != nil
        end
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

  def self.ios_shows(user, page)
    return user.shows.sorted_list.paginate(page: page)
  end

  def self.plex_add(data, user_id)
    user = User.find(user_id.to_i)
    title = data['type'] == 'show' ? data['title'].downcase() : data['grandparentTitle'].downcase()
    season_number = data['type'] == 'show' ? data['childCount'] : data['parentIndex']
    episode_number = data['index'] if data['type'] != 'show'
    year = title == 'matlock' ? 2024 : data['year']
    show = nil
    season = nil
    episode = nil
    episodes = []

    series = get_series(title)
    series.each do |s|
      series_condition = data['type'] == 'show' ? s[:title].downcase() == title && s[:season].to_i == season_number && s[:year].to_i == year : s[:title].downcase() == title && s[:season].to_i == season_number
      if series_condition
        show = Show.find_by(show_collection_id: s[:show_collection_id]) || Show.new(title: s[:title], year: s[:year], rating: s[:rating], genre: s[:genre], poster: s[:poster], show_collection_id: s[:show_collection_id])
        s.except!(:genre, :rating, :title, :year, :show_collection_id)
        season = Season.find_by(collectionId: s[:collectionId]) || show.seasons.new(s)

        if season.collectionId.include? 'tvdb'
          episodes = data['type'] == 'show' ? tvdb_episodes(show.show_collection_id, season_number) : tvdb_episodes(show.show_collection_id, season_number, episode_number)
        elsif season.collectionId.include? 'tmdb'
          episodes = data['type'] == 'show' ? tmdb_episodes(show.show_collection_id, season_number) : tmdb_episodes(show.show_collection_id, season_number, episode_number)
        else
          episodes = data['type'] == 'show' ? appletv_episodes(season.appleTvId, (season.skip.to_i).to_s, season.count.to_s, season.storeId) : appletv_episodes(season.appleTvId, (season.skip.to_i + episode_number - 1).to_s, 1.to_s, season.storeId)
        end

        if data['type'] == 'episode'
          episodes.each do |episode|
            if episode[:title].downcase() == plex_title(data['title'])
              new_episode = season.episodes.find_by(tv_episode: episode[:tv_episode]) || season.episodes.new(episode)
              save_show(user, s, show, season, new_episode)
            elsif title == 'matlock' && show[:show_collection_id] == 'umc.cmc.4qkh3w8zjpnf2pwol5809ktfu'
              new_episode = season.episodes.find_by(tv_episode: episode[:tv_episode]) || season.episodes.new(episode)
              save_show(user, s, show, season, new_episode)
            end
          end
        else
          episodes.each do |episode|
            new_episode = season.episodes.find_by(tv_episode: episode[:tv_episode]) || season.episodes.new(episode)
            save_show(user, s, show, season, new_episode)
          end
        end
      end
    end
  end

  private

  def create_sort_name
    self.sort_name = self.title.gsub(/^(The\b*\W|A\b*\W|An\b*\W)/, '').downcase
  end

  def create_search_name
    self.search_name = self.title.downcase if self.title != 'M*A*S*H'
  end

  def add_season_count
    self.seasonNumbers = self.season_numbers.to_s
    self.seasonCount = self.seasons.count.to_s
    self.episodeCount = self.episode_count.to_s
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

  def self.get_year(d)
    if !d.nil? && !d.empty?
      date = DateTime.parse(d)
      date.year
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

  def self.get_tvdb_collection_id(s, i)
    collection_id = "tvdb#{s}#{i}"
  end

  def self.get_tmdb_collection_id(s, i)
    collection_id = "tmdb#{s}#{i}"
  end

  def self.clean_up_title(t)
    new_t = t.gsub(/\"/, '')
  end

  def self.plex_title(t)
    new_t = t.gsub(/\s\(.*\)/,'').downcase()
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

  def self.get_tmdb_rating(s)
    if !s.empty?
      rating = s.select { |rating| rating['iso_3166_1'] == 'US'}
      if !rating.empty?
        rating[0]['rating']
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

  def self.tmdb_request(url)
    uri = URI.parse(url)
    request = Net::HTTP::Get.new(uri)
    request["Accept"] = "application/json"
    request["Authorization"] = "Bearer " + ENV['TMDB_TOKEN']


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

  def self.use_tvdb(s_term)
    details = []
    if JwtAuth.has_expired?(ENV['TVDB_TOKEN'])
      token_response = tvdb_auth()
      ENV['TVDB_TOKEN'] = token_response[:body]['data']['token']
    end
    
    first_response = tvdb_call("https://api4.thetvdb.com/v4/search?query=" + CGI.escape(s_term) + "&type=series&limit=1")
    if first_response && first_response[:code] == '200'
      first_response[:body]['data'].each do |s|
        second_response = tvdb_call("https://api4.thetvdb.com/v4/series/" + s['tvdb_id'].to_s + "/extended?meta=translations&short=true")
        aired_seasons = []
        if !second_response[:body].nil? || !second_response[:body].empty? && second_response[:code] == '200'
            second_response[:body]['data']['seasons'].each do |sea|
            aired_seasons << sea['number'] if sea['number'] != 0 && sea['type']['type'] == 'official'
          end
          aired_seasons.each do |a|
            season_number = a
            collection_name = get_collection_name(s['name'], season_number.to_s)
            artwork = tvdb_call("https://api4.thetvdb.com/v4/series/" + s['tvdb_id'] + "/artworks?lang=eng&type=5" )
              if !artwork[:body].nil? || !artwork[:body].empty? && artwork[:code] == '200'
                if artwork[:body]['data'].has_key?('artworks') && artwork[:body]['data']['artworks'].length > 0
                  poster = artwork[:body]['data']['artworks'][0]['image']
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
              details << {title: s['name'], collectionName: collection_name, collectionId: get_tvdb_collection_id(s['tvdb_id'], season_number.to_s), season: season_number.to_s, poster: poster, rating: rating, year: year, plot: overview, genre: genre, show_collection_id: s['tvdb_id']}
          end
        end
      end
    end
    return details
  end

  def self.tvdb_episodes(id, season, episode_number=nil)
    episodes = []
    if JwtAuth.has_expired?(ENV['TVDB_TOKEN'])
      token_response = tvdb_auth()
      ENV['TVDB_TOKEN'] = token_response[:body]['data']['token']
    end

    if episode_number.nil?
      first_response = tvdb_call("https://api4.thetvdb.com/v4/series/" + id.to_s + "/episodes/official?page=0&season=" + season.to_s)
      first_response[:body]['data']['episodes'].each do |e|
        if e['aired'] != ''
          preview = e['image'] ? e['image'] : ''
          plot = e.has_key?('overview') || e.has_key?(:overview) ? get_plot(e['overview']) : ''
          runtime = e['runtime'] ? e['runtime'].to_s : ''
          episodes << {title: e['name'], date: convert_date(e['aired']), plot: HTMLEntities.new.decode(plot), runtime: runtime, tv_episode: e['number'], preview: preview}
        end
      end
    else
      first_response = tvdb_call("https://api4.thetvdb.com/v4/series/" + id.to_s + "/episodes/official?page=0&season=" + season.to_s)
      first_response[:body]['data']['episodes'].each do |e|
        if e['number'] == episode_number
          if e['aired'] != ''
            preview = e['image'] ? e['image'] : ''
            plot = e.has_key?('overview') || e.has_key?(:overview) ? get_plot(e['overview']) : ''
            runtime = e['runtime'] ? e['runtime'].to_s : ''
            episodes << {title: e['name'], date: convert_date(e['aired']), plot: HTMLEntities.new.decode(plot), runtime: runtime, tv_episode: e['number'], preview: preview}
          end
        end
      end
    end
    return episodes
  end

  def self.tmdb_call(s_term, match_all=true)
    details = []
    search_response = tmdb_request('https://api.themoviedb.org/3/search/tv?query=' + CGI.escape(s_term))
    if search_response && search_response[:code] == '200'
      search_response[:body]['results'].each do |show|
        if match_all
          series_response = tmdb_request('https://api.themoviedb.org/3/tv/' + show['id'].to_s + '?append_to_response=content_ratings')
            series_response[:body]['seasons'].each do |s|
              if s['season_number'] != 0
              season_response = tmdb_request('https://api.themoviedb.org/3/tv/' + show['id'].to_s + '/season/' + s['season_number'].to_s)
                collection_name = get_collection_name(show['name'], season_response[:body]['season_number'].to_s)
                artwork = !season_response[:body]['poster_path'].nil? ? 'https://image.tmdb.org/t/p/original' + season_response[:body]['poster_path'] : ''
                overview = season_response[:body]['overview'].empty? ? show['overview'] : season_response[:body]['overview']
                year = get_year(show['first_air_date']).to_s
                genre = !series_response[:body]['genres'].empty? ? series_response[:body]['genres'][0]['name'] : ''
                rating = series_response[:body].has_key?('content_ratings') || series_response[:body].has_key?(:content_ratings) ? get_tmdb_rating(series_response[:body]['content_ratings']['results']) : ''
                details << {title: show['name'], collectionName: collection_name, collectionId: get_tmdb_collection_id(show['id'], season_response[:body]['season_number'].to_s), season: season_response[:body]['season_number'].to_s, poster: artwork, rating: rating, year: year, plot: overview, genre: genre, show_collection_id: show['id'].to_s}
              end
            end
        else
          if show['name'].downcase() == s_term.downcase()
            series_response = tmdb_request('https://api.themoviedb.org/3/tv/' + show['id'].to_s + '?append_to_response=content_ratings')
            series_response[:body]['seasons'].each do |s|
              if s['season_number'] != 0
              season_response = tmdb_request('https://api.themoviedb.org/3/tv/' + show['id'].to_s + '/season/' + s['season_number'].to_s)
                collection_name = get_collection_name(show['name'], season_response[:body]['season_number'].to_s)
                artwork = !season_response[:body]['poster_path'].nil? ? 'https://image.tmdb.org/t/p/original' + season_response[:body]['poster_path'] : ''
                overview = season_response[:body]['overview'].empty? ? show['overview'] : season_response[:body]['overview']
                year = get_year(show['first_air_date']).to_s
                genre = !series_response[:body]['genres'].empty? ? series_response[:body]['genres'][0]['name'] : ''
                rating = series_response[:body].has_key?('content_ratings') || series_response[:body].has_key?(:content_ratings) ? get_tmdb_rating(series_response[:body]['content_ratings']['results']) : ''
                details << {title: show['name'], collectionName: collection_name, collectionId: get_tmdb_collection_id(show['id'], season_response[:body]['season_number'].to_s), season: season_response[:body]['season_number'].to_s, poster: artwork, rating: rating, year: year, plot: overview, genre: genre, show_collection_id: show['id'].to_s}
              end
            end
          end 
        end
      end
    end
    return details
  end

  def self.tmdb_episodes(id, season, episode_number=nil)
    episodes = []
    if episode_number.nil?
      first_response = tmdb_request('https://api.themoviedb.org/3/tv/' + id.to_s + '/season/' + season.to_s)
      first_response[:body]['episodes'].each do |e|
        if e['air_date'] != ''
          preview = e['still_path'] ? 'https://image.tmdb.org/t/p/original' + e['still_path'] : ''
          plot = e.has_key?('overview') || e.has_key?(:overview) ? get_plot(e['overview']) : ''
          runtime = e['runtime'] ? e['runtime'].to_s : ''
          episode = {title: e['name'], date: convert_date(e['air_date']), plot: HTMLEntities.new.decode(plot), runtime: runtime, tv_episode: e['episode_number'], preview: preview}
          episodes << episode
        end
      end
    else
      first_response = tmdb_request('https://api.themoviedb.org/3/tv/' + id.to_s + '/season/' + season.to_s + '/episode/' + episode_number.to_s)
      e = first_response[:body]
      if e['air_date'] != ''
        preview = e['still_path'] ? 'https://image.tmdb.org/t/p/original' + e['still_path'] : ''
        plot = e.has_key?('overview') || e.has_key?(:overview) ? get_plot(e['overview']) : ''
        runtime = e['runtime'] ? e['runtime'].to_s : ''
        episode = {title: e['name'], date: convert_date(e['air_date']), plot: HTMLEntities.new.decode(plot), runtime: runtime, tv_episode: e['episode_number'], preview: preview}
        episodes << episode
      end
    end
    return episodes
  end

  def self.appletv_call(s_term)
    details = []
    storeIds = ['143441', '143444', '143455', '143460']
    storeIds.each do |store|
    response = HTTParty.get('https://uts-api.itunes.apple.com/uts/v2/search/incremental?sf=' + store + '&locale=en-US&utsk=0&caller=wta&v=36&pfm=desktop&q=' + CGI.escape(s_term))

      if response['data']['canvas'] != nil
        response['data']['canvas']['shelves'].each do |show|
          show['items'].each do |s|
            i = 0
            startCount = 0
            s['type'] == 'Show' && s['title'] && s['title'].downcase() == s_term.downcase()
            if s['type'] == 'Show' && s['title'] && s['title'].downcase() == s_term.downcase()
              request1 = HTTParty.get('https://uts-api.itunes.apple.com/uts/v2/view/show/' + s['id'] + '?sf=' + store + '&locale=en-US&utsk=0&caller=wta&v=36&pfm=desktop')
              title =  request1['data']['content']['title']
              description = request1['data']['content']['description']
              genre = request1['data']['content']['genres'] ? request1['data']['content']['genres'][0]['name'] : ''
              rating = request1['data']['content']['rating'] ? request1['data']['content']['rating']['displayName'] : ''
              date = request1['data']['content']['releaseDate'] ? Time.at(request1['data']['content']['releaseDate'] / 1000).to_datetime.year.to_s : ''
              show_collection_id = s['id']
              request2 = HTTParty.get('https://uts-api.itunes.apple.com/uts/v2/view/show/' + s['id'] + '/episodes?sf=' + store + '&locale=en-US&utsk=0&caller=wta&v=36&pfm=desktop')
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
              elsif !request2['data']['episodes'].empty?
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

  def self.appletv_episodes(id, skip, count, storeId)
    episodes = []
    episodes_response = HTTParty.get('https://tv.apple.com/api/uts/v2/view/show/' + id + '/episodes?skip=' + skip + '&count=' + count + '&sf=' + storeId + '&locale=en-US&utsk=0&caller=wta&v=36&pfm=desktop')
      return nil if episodes_response.length == 0

      episodes_response['data']['episodes'].each do |e|
        poster = e['images']['previewFrame'] ? e['images']['previewFrame']['url'].gsub(/({w}x{h}.{f})/, '300x169.jpg') : e['showImages']['keyframe']['url'].gsub(/({w}x{h}.{f})/, '300x169.jpg')
        date = e['releaseDate'] ? Time.at(e['releaseDate'] / 1000).to_datetime.strftime("%b %-d, %Y") : ''
        runtime = e['duration'] ? e['duration'] / 60 : ''
        episodes << {title: clean_up_title(e['title']), date: date, plot: HTMLEntities.new.decode(e['description']), runtime: runtime, tv_episode: e['episodeNumber'], preview: poster}
      end
      return episodes
  end

  def self.save_show(user, series, show, season, episode)
    if show.save
      show.users << user if !show.users.include?(user)
      if season.save
        season.update(count: series[:count])
        season.update(storeId: series[:storeId]) if season[:storeId] == nil && series[:storeId] != nil
        if show.seasons.length == 1
          season.update(is_active: true)
        end
      end
      if episode.save
        season.episodes << episode if !season.episodes.include?(episode)
      end
    end
  end

  def self.is_number?(string)
    true if Float(string) rescue false
  end

end
