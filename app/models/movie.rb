class Movie < ActiveRecord::Base


  self.per_page = 100

  validates :title, presence: true

  has_and_belongs_to_many :users
  has_many :ratings

  before_create :create_sort_name
  before_create :create_duration
  before_save :create_search_name
  before_save :create_director_check
  before_save :update_user_count
  before_update :adjust_url

  scope :sorted_list, -> {order(:sort_name, :year, :id)}
  scope :recently_added, -> {order(created_at: :desc, id: :desc)}

  # Grid-sized poster: Apple artwork is sized in the URL (often stored at 2000x3000); other hosts stay as stored.
  def thumbnail
    poster.to_s.sub(%r{(mzstatic\.com/.+)/\d+x\d+[a-z]*\.(jpg|png|webp)\z}, '\1/348x522bb.\2')
  end
  scope :top_movies, -> {order(user_count: :desc, id: :asc)}

  def self.get_titles(t)
    MovieSearch.titles(t, Movie.where("search_name LIKE ?", "%#{t}%").sorted_list.first(10))
  end

  def self.plex_add(data, user)
    user = User.find(user.to_i)
    movie = Movie.where('title = ? AND year = ?', data['title'], data['year'].to_s)
    if movie.empty?
      movies = get_titles(data['title'].downcase)
      movies.each do |movie|
        if movie[:title].downcase() == data['title'].downcase() && movie[:year] == data['year'].to_s
          movie = Movie.new(movie)
          if movie.save
            movie.users << user if !movie.users.include?(user)
            movie.save
          end
        end 
      end
    end
  end

  def self.plex_count()
    plex_response = HTTParty.get('https://plex.toddseller.dev/api/v2?apikey=' + ENV['TAUTULLI_KEY'] + '&cmd=get_libraries', timeout: AppleTv::TIMEOUT)
    movies = plex_response['response']['data'][0]['count']
    shows = plex_response['response']['data'][1]['count']
    episodes = plex_response['response']['data'][1]['child_count']

    {movies: movies, shows: shows, episodes: episodes}
  end

  def self.update_title_search(t)
    MovieSearch.titles(t)
  end

  def self.search_person(n)
    person = Tmdb.get('search/person', query: n)[:body]['results'].first
    person && person['profile_path'] ? 'https://image.tmdb.org/t/p/w342' + person['profile_path'] : nil
  end

  # def self.user_count
  #   self.all.sort_by { |movie| [movie.users.count, movie[:sort_name]] }.reverse![0, 6]
  # end
  def self.basic_info(u)
    u.movies.sorted_list.map { |movie| {id: movie.id, title: movie.title, sort_name: movie.sort_name, search_name: movie.search_name, poster: movie.poster, year: movie.year, isnew: movie.isnew} }
  end

  def self.ios_movies(user, page)
    movies_list = []
    user.movies.sorted_list.paginate(page: page).each { |movie| movies_list << {id: movie.id, title: movie.title, plot: movie.plot, poster: movie.poster, year: movie.year, actors: movie.actors, director: movie.director, genre: movie.genre, producer: movie.producer, rating: movie.rating, runtime: movie.runtime, studio: movie.studio, writer: movie.writer, isNew: movie.isnew, hd: movie.hd, sortName: movie.sort_name}}
    movies_list
  end

  def get_average
    sum = self.ratings.map(&:stars).inject(:+)
    average = self.ratings.length > 0 ? (sum.to_f / self.ratings.count).round : 0
  end

  def self.filter_movies(f, u)
    user = User.find(u)
    title = f.downcase
    movies = user.movies.where('search_name LIKE ?', "%#{title}%")
  end

  def self.search(f, u)
    user = User.find(u)
    f = f.split.length == 1 ? f.split.map(&:capitalize).join(' ') : f == f.split.join(' ') ? f : f.split.map(&:capitalize).join(' ')
    movies = user.movies.where('actors LIKE ? OR director LIKE ? OR producer LIKE ? OR writer LIKE ? OR studio LIKE ?', "%#{f}%", "%#{f}%", "%#{f}%", "%#{f}%", "%#{f}%")
  end

  private

  def create_sort_name
    self.sort_name = self.title.gsub(/^(The\b*\W|A\b*\W|An\b*\W)/, '').downcase
  end

  def create_search_name
    self.search_name = self.title.downcase
  end

  def create_director_check
    self.director_check = self.director != '' ? self.director.split(' ').slice(-1, 1).join() : ''
  end

  def update_user_count
    self.user_count = self.users.count
  end

  def create_duration
    time = self.runtime.to_i
    hour = time.round / 60
    min = time % 60
    if hour == 1
      self.runtime = hour.to_s + ' hour, ' + min.to_s + ' minutes'
    elsif hour > 1
      self.runtime = hour.to_s + ' hours, ' + min.to_s + ' minutes'
    else
      self.runtime = min.to_s + ' minutes'
    end
  end

  def adjust_url
    if self.poster =~ /http:/ && !(self.poster =~ /-ssl.mzstatic/)
      self.poster.gsub!(/^(http)/, 'https')
      self.poster.gsub!(/(\.mzstatic)/, '-ssl.mzstatic')
    end
  end

  def self.get_actors(r)
    actors = []
    r['credits']['cast'].each {|k| actors << k['name']}
    actors.length != 0 ? actors.first(6).join(', ') : ''
  end

  def self.get_director(r)
    director = []
    r['credits']['crew'].each {|k| director << k['name'] if k['job'] == 'Director'}
    director.length != 0 ? director.first(6).join(', ') : ''
  end

  def self.get_genres(r)
    genres = []
    r['genres'].each {|k| genres << k['name']} if r['genres']
    genres.length != 0 ? genres[0] : ''
  end

  def self.get_plot(p)
    new_p = p.gsub(/\<[i|b]\>|\<\/[i|b]\>/, '')
    new_p = new_p.gsub(/\'/, '&#39;')
    new_p = new_p.gsub(/\"/, '&#34;')
    new_p = new_p.gsub(/\r|\n/, '')
    new_p = new_p.gsub(/—|-/, '&#8211;')
    new_p = new_p.gsub(/\"\"/, '&#34;')
  end

  def self.get_producers(r)
    producers = []
    r['credits']['crew'].each {|k| producers << k['name'] if k['job'] == 'Producer'}
    producers.length != 0 ? producers.first(6).join(', ') : ''
  end

  def self.get_rating(r)
    rating = ''
    r['releases']['countries'].each {|k| rating = k['certification'] if k['iso_3166_1'] == 'US'} if r['releases']['countries'] != nil
    rating != '' ? rating.upcase : 'NR'
  end

  def self.get_studio(r)
    studio = []
    r['production_companies'].each {|k| studio << k['name']} if r['production_companies']
    studio.length != 0 ? studio.first(1).join() : ''
  end

  def self.get_writers(r)
    writers = []
    r['credits']['crew'].each {|k| writers << k['name'] if k['job'] == 'Screenplay' || k['job'] == 'Writer'}
    writers.length != 0 ? writers.first(6).join(', ') : ''
  end

  def self.get_first_six(a)
    a.length != 0 ? a.first(6).join(', ') : ''
  end

end
