class Show < ActiveRecord::Base

  self.per_page = 50

  validates :title, presence: true

  has_and_belongs_to_many :users
  has_many :seasons, -> { order(season: :asc) }

  accepts_nested_attributes_for :seasons

  before_create :create_sort_name
  before_save :create_search_name
  before_save :add_season_count

  scope :sorted_list, -> { order(:sort_name, :year, :id) }
  scope :recently_added, -> {order(created_at: :desc, id: :desc)}

  # Grid-sized poster: Apple artwork is sized in the URL; other hosts stay full size.
  def thumbnail
    poster.to_s.sub(/600x600\.jpg\z/, '400x400.jpg')
  end

  def self.get_series(t)
    # Read the database here: the lookups below run on other threads and must not touch ActiveRecord.
    db_seasons = Show.where("search_name LIKE ?", "%#{t}%").sorted_list.includes(:seasons).flat_map do |show|
      show.seasons.map do |season|
        season.attributes.symbolize_keys.merge(title: show.title, show_collection_id: show[:show_collection_id], year: show[:year])
      end
    end

    db_rows, series_response, tmdb_response = InParallel.map([:db, :apple, :tmdb], limit: 3) do |source|
      case source
      when :db then refresh_apple_counts(db_seasons)
      when :apple then appletv_call(t)
      when :tmdb then tmdb_call(t)
      end
    end

    # Merge only once every source has answered, so the database, then Apple, then TMDB order holds.
    # Same-named shows years apart (the UK and US Office) are different shows, so both are kept.
    series = db_rows || []
    series_response, tmdb_response = [series_response, tmdb_response].map { |rows| (rows || []).select { |s| from_stored_source?(series, s) } }
    (series_response || []).each do |s|
      series << s if series.all? {|el| !Match.same_name?(el[:collectionName], s[:collectionName]) || !Match.same_year?(el[:year], s[:year]) || el[:show_collection_id] != s[:show_collection_id] && is_number?(s[:season])}
    end
    (tmdb_response || []).each do |s|
      series << s if series.all? {|el| !Match.same_name?(el[:collectionName], s[:collectionName]) || !Match.same_year?(el[:year], s[:year])}
    end
    series.sort {|a, b| [a[:year], a[:title], a[:season].to_i] <=> [b[:year], b[:title], b[:season].to_i]}
  end

  # Adding a season finds its show by show_collection_id, so a season of a stored show under another id would create a second copy of the show.
  def self.from_stored_source?(db_rows, s)
    stored = db_rows.select { |el| Match.same_name?(el[:title], s[:title]) && Match.same_year?(el[:year], s[:year]) }
    stored.empty? || stored.any? { |el| el[:show_collection_id] == s[:show_collection_id] } && stored.none? { |el| el[:season].to_i == s[:season].to_i }
  end

  # Every season of a show comes from the same Apple season list, so it is fetched once per show and storefront.
  def self.refresh_apple_counts(db_seasons)
    store_of = ->(db_season) { db_season[:storeId] || AppleTv::STORES.first }
    shows = db_seasons.select { |db_season| db_season[:appleTvId].present? }.map { |db_season| [db_season[:appleTvId], store_of.(db_season)] }.uniq
    lists = shows.zip(InParallel.map(shows) { |id, store| apple_seasons(id, store) }).to_h
    db_seasons.map { |db_season| db_season[:appleTvId].present? ? refresh_apple_count(db_season, lists[[db_season[:appleTvId], store_of.(db_season)]]) : db_season }
  end

  def self.refresh_apple_count(db_season, seasons_data)
    window = season_window(seasons_data, db_season[:season])
    if window
      db_season[:storeId] ||= AppleTv::STORES.first
      db_season[:count] = window.last.to_s
    end
    db_season
  end

  def self.get_episodes(id, season, skip=nil, count=nil, storeId='143441')
    episodes = []
    if id.include? 'tmdb'
      id = id.gsub(/tmdb/,'')
      id = id[0...-season.to_s.length]
      tmdb_episodes = tmdb_episodes(id, season)

      if tmdb_episodes.length > 0
        tmdb_episodes.each do |e|
          episodes << e if e[:tv_episode] != nil
        end
      end
    else
      # Only Apple seasons have a stored window; any other source (TVDB) has nothing to list here.
      return [] if skip.nil?
      skip, count = apple_season_window(id, season, storeId) || [skip, count]
      episode_response = appletv_episodes(id, skip.to_s, count.to_s, storeId, season)

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

        if season.collectionId.include? 'tmdb'
          episodes = data['type'] == 'show' ? tmdb_episodes(show.show_collection_id, season_number) : tmdb_episodes(show.show_collection_id, season_number, episode_number)
        else
          skip, count = apple_season_window(season.appleTvId, season_number, season.storeId) || [season.skip.to_i, season.count.to_i]
          episodes = data['type'] == 'show' ? appletv_episodes(season.appleTvId, skip.to_s, count.to_s, season.storeId, season_number) : appletv_episodes(season.appleTvId, (skip + episode_number - 1).to_s, '1', season.storeId, season_number)
        end

        if data['type'] == 'episode'
          episodes.each do |episode|
            if episode[:tv_episode].to_i == episode_number.to_i
              new_episode = season.episodes.find_or_initialize_by(tv_episode: episode[:tv_episode])
              new_episode.assign_attributes(episode)
              save_show(user, s, show, season, new_episode)
            end
          end
        else
          episodes.select { |episode| aired?(episode[:date]) }.each do |episode|
            new_episode = season.episodes.find_or_initialize_by(tv_episode: episode[:tv_episode])
            new_episode.assign_attributes(episode)
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

  def self.get_collection_name(s, i)
    collection_name = s + ', Season ' + i if s != nil && i != nil
  end

  def self.get_tmdb_collection_id(s, i)
    collection_id = "tmdb#{s}#{i}"
  end

  def self.clean_up_title(t)
    new_t = t.gsub(/\"/, '')
  end

  def self.aired?(date)
    Date.parse(date) <= Date.today
  rescue Date::Error
    false
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

  # TMDB allows 20 appended items per request; content_ratings takes one of them on the first request.
  TMDB_SEASONS_PER_REQUEST = 19

  def self.tmdb_call(s_term)
    search_response = Tmdb.get('search/tv', query: s_term)
    return [] unless search_response && search_response[:code] == '200'
    InParallel.map(search_response[:body]['results']) { |show| tmdb_show(show) }.compact.flatten(1)
  end

  # Missing seasons are left out of the response, so seasons 1-19 can be asked for before the count is known.
  def self.tmdb_show(show)
    details = []
    path = 'tv/' + show['id'].to_s
    seasons = (1..TMDB_SEASONS_PER_REQUEST).map { |n| "season/#{n}" }
    series_response = Tmdb.get(path, append_to_response: (['content_ratings'] + seasons).join(','))
    later = series_response[:body]['seasons'].map { |s| s['season_number'] }.select { |n| n > TMDB_SEASONS_PER_REQUEST }
    later.each_slice(TMDB_SEASONS_PER_REQUEST + 1) do |numbers|
      series_response[:body].merge!(Tmdb.get(path, append_to_response: numbers.map { |n| "season/#{n}" }.join(','))[:body].select { |key, _| key.start_with?('season/') })
    end
    series_response[:body]['seasons'].each do |s|
      season = series_response[:body]["season/#{s['season_number']}"]
      if s['season_number'] != 0 && season
        collection_name = get_collection_name(show['name'], season['season_number'].to_s)
        artwork = !season['poster_path'].nil? ? 'https://image.tmdb.org/t/p/original' + season['poster_path'] : ''
        overview = season['overview'].empty? ? show['overview'] : season['overview']
        year = get_year(show['first_air_date']).to_s
        genre = !series_response[:body]['genres'].empty? ? series_response[:body]['genres'][0]['name'] : ''
        rating = series_response[:body].has_key?('content_ratings') || series_response[:body].has_key?(:content_ratings) ? get_tmdb_rating(series_response[:body]['content_ratings']['results']) : ''
        details << {title: show['name'], collectionName: collection_name, collectionId: get_tmdb_collection_id(show['id'], season['season_number'].to_s), season: season['season_number'].to_s, poster: artwork, rating: rating, year: year, plot: overview, genre: genre, show_collection_id: show['id'].to_s}
      end
    end
    details
  end

  def self.tmdb_episodes(id, season, episode_number=nil)
    episodes = []
    if episode_number.nil?
      first_response = Tmdb.get('tv/' + id.to_s + '/season/' + season.to_s)
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
      first_response = Tmdb.get('tv/' + id.to_s + '/season/' + season.to_s + '/episode/' + episode_number.to_s)
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

  APPLE_SHOW_LIMIT = 10

  def self.appletv_call(s_term)
    InParallel.map(AppleTv.matches(s_term, 'Show', APPLE_SHOW_LIMIT)) { |id, store| appletv_show(id, store) }.compact.flatten(1)
  end

  def self.appletv_show(id, store)
    details = []
    request1, request2 = InParallel.map(['', '/episodes'], limit: 2) do |path|
      AppleTv.view('show/' + id + path, store)
    end
    if request1 && request1.code == 200 && request1['data'] && request1['data']['content']
      title =  request1['data']['content']['title']
      description = request1['data']['content']['description']
      genre = request1['data']['content']['genres'] ? request1['data']['content']['genres'][0]['name'] : ''
      rating = request1['data']['content']['rating'] ? request1['data']['content']['rating']['displayName'] : ''
      date = request1['data']['content']['releaseDate'] ? Time.at(request1['data']['content']['releaseDate'] / 1000).to_datetime.year.to_s : ''

      if request2 && request2.code == 200 && request2['data']
        if request2['data']['seasonSummaries']
          i = 0
          startCount = 0
          request2['data']['seasonSummaries'].each do |season|
            collectionName = title + ', ' + season['label']
            collectionId = request2['data']['seasons'][i]['id']
            poster = request2['data']['seasons'][i]['images'] && request2['data']['seasons'][i]['images']['coverArt'] ? request2['data']['seasons'][i]['images']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg') : request2['data']['seasons'][i]['showImages'] && request2['data']['seasons'][i]['showImages']['coverArt'] ? request2['data']['seasons'][i]['showImages']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg') : 'https://s3-us-west-2.amazonaws.com/toddseller/tedflix/imgs/Artboard+1-196x196.jpg'
            seasonNumber = request2['data']['seasons'][i]['seasonNumber'].to_s
            skip = seasonNumber == '1' ? 0 : startCount
            details << {appleTvId: id, title: title, collectionName: collectionName, collectionId: collectionId, season: seasonNumber, rating: rating, genre: genre, plot: get_plot(description), year: date, poster: poster, skip: skip, count: season['episodeCount'], storeId: store, show_collection_id: id}
            i += 1
            startCount += season['episodeCount']
          end
        elsif request2['data']['episodes'] && !request2['data']['episodes'].empty?
          collectionName = request2['data']['episodes'][0]['title'] + ', Season 1'
          collectionId = request2['data']['episodes'][0]['id']
          poster = request2['data']['episodes'][0]['images'] && request2['data']['episodes'][0]['images']['coverArt'] ? request2['data']['episodes'][0]['images']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg') : request2['data']['episodes'][0]['showImages'] && request2['data']['episodes'][0]['showImages']['coverArt'] ? request2['data']['episodes'][0]['showImages']['coverArt']['url'].gsub(/({w}x{h}.{f})/, '600x600.jpg') : 'https://s3-us-west-2.amazonaws.com/toddseller/tedflix/imgs/Artboard+1-196x196.jpg'
          details << {appleTvId: id, title: title, collectionName: collectionName, collectionId: collectionId, season: '1', rating: rating, genre: genre, plot: get_plot(description), year: date, poster: poster, skip: 0, count: 1, storeId: store, show_collection_id: id}
        end
      end
    end
    details
  end

  # Apple lists a show's episodes in one run across seasons, and inserts episodes into old seasons later,
  # so a season's start is summed from Apple's current season sizes rather than trusted from when it was stored.
  def self.apple_season_window(id, season_number, storeId) = season_window(apple_seasons(id, storeId), season_number)

  def self.apple_seasons(id, storeId)
    HTTParty.get('https://tv.apple.com/api/uts/v2/view/show/' + id + '/episodes?sf=' + (storeId.presence || AppleTv::STORES.first) + AppleTv::PARAMS, timeout: AppleTv::TIMEOUT)['data']
  rescue StandardError => e
    puts "Apple season list failed for #{id}: #{e.message}"
    nil
  end

  def self.season_window(data, season_number)
    index = data && data['seasons'] && data['seasons'].index { |season| season['seasonNumber'].to_i == season_number.to_i }
    return nil unless index && data['seasonSummaries']
    counts = data['seasonSummaries'].map { |summary| summary['episodeCount'].to_i }
    [counts.first(index).sum, counts[index]]
  end

  def self.appletv_episodes(id, skip, count, storeId, season_number = nil)
    episodes = []
    # Seasons added in 2019, before the storefront was stored, have none; every lookup then used the US store.
    storeId = storeId.presence || AppleTv::STORES.first
    begin
      episodes_response = HTTParty.get('https://tv.apple.com/api/uts/v2/view/show/' + id + '/episodes?skip=' + skip + '&count=' + count + '&sf=' + storeId + '&locale=en-US&utsk=0&caller=wta&v=58&pfm=appletv', timeout: AppleTv::TIMEOUT)
      if episodes_response.code == 200 && episodes_response['data'] && episodes_response['data']['episodes']
        episodes_response['data']['episodes'].each do |e|
          next if season_number && e['seasonNumber'] && e['seasonNumber'].to_i != season_number.to_i
          poster = e['images']['previewFrame'] ? e['images']['previewFrame']['url'].gsub(/({w}x{h}.{f})/, '300x169.jpg') : e['showImages'] && e['showImages']['keyframe'] ? e['showImages']['keyframe']['url'].gsub(/({w}x{h}.{f})/, '300x169.jpg') : ''
          date = e['releaseDate'] ? Time.at(e['releaseDate'] / 1000).to_datetime.strftime("%b %-d, %Y") : ''
          runtime = e['duration'] ? e['duration'] / 60 : ''
          episodes << {title: clean_up_title(e['title']), date: date, plot: HTMLEntities.new.decode(e['description']), runtime: runtime, tv_episode: e['episodeNumber'], preview: poster}
        end
      end
    rescue JSON::ParserError
      puts "Error parsing JSON in appletv_episodes for id: #{id}"
    rescue => e
      puts "Error in appletv_episodes: #{e.message}"
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
