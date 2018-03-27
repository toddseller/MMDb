class Show < ActiveRecord::Base

  validates :title, presence: true

  has_and_belongs_to_many :users
  has_many :seasons

  before_create :create_sort_name
  before_save :create_search_name

  scope :sorted_list, -> { order(:sort_name, :year) }

  def self.get_series(t)
    series = []

    series_response = JSON.parse(HTTParty.get('https://itunes.apple.com/search?term=' + t + '&media=tvShow&entity=tvSeason'))

    if series_response.length == 0
      series_response['results'].each do |s|
        year = s['releaseDate'] != nil ? s['releaseDate'].split('-').slice(0,1).join() : ''
        rating = s['contentAdvisoryRating'] ? s['contentAdvisoryRating'] : ''
        details = {title: s['artistName'], collectionName: s['collectionName'], collectionId: s['collectionId'], season: get_season(s['collectionName']), poster: set_image(s['artworkUrl100']), rating: rating, year: year, plot: get_plot(s['longDescription']), genre: s['primaryGenreName']}
        series << details
      end
    else
      token_request = token.length > 1 ? JSON.parse(`curl -X GET --header 'Accept: application/json' --header 'Authorization: Bearer #{token}' 'https://api.thetvdb.com/refresh_token'`) : JSON.parse(`curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{"apikey": "#{ENV['TVDB_KEY']}","username":"#{ENV['TVDB_USER']}","userkey":"#{ENV['TVDB_USER_KEY']}"}
' 'https://api.thetvdb.com/login'`)
      p '+' * 80
      p token = token_request['token']
      t = URI::encode(t)
      p series_response = JSON.parse(`curl -X GET --header 'Accept: application/json' --header 'Authorization: Bearer "#{token}"' 'https://api.thetvdb.com/search/series?name="#{t}"'`)
    end
    series.sort_by {|k| k[:year]}
  end

  def self.get_episodes(id)
    episodes = []

    episodes_response = JSON.parse(HTTParty.get('https://itunes.apple.com/lookup?id=' + id + '&country=us&entity=tvEpisode'))
    return nil if episodes_response.length == 0

    episodes_response['results'].each do |e|
      episode = {title: e['trackName'], date: convert_date(e['releaseDate']), plot: e['longDescription'], runtime: e['trackTimeMillis'], tv_episode: e['trackNumber'], preview: e['previewUrl']}
      episodes << episode if e['trackId']
    end
    episodes.sort_by {|k| k[:tv_episode]}
  end

  def season_numbers
    numbers = []
    self.seasons.each {|s| numbers << s.season.to_i}
    numbers.sort.each_cons(2).all? { |x,y| y == x + 1 } && numbers.length >= 3 ? numbers.sort.values_at(0,-1).join('–') : numbers.length >= 2 ? numbers.sort.join(', ') : numbers.sort.join()
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
    p.gsub!(/^(http)/, 'https')
    p.gsub!(/(is\d)/, 'is5-ssl')
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

end
