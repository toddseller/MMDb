class Movie < ActiveRecord::Base


  validates :title, presence: true

  has_and_belongs_to_many :users
  has_many :ratings

  before_create :create_sort_name
  before_create :create_duration
  before_save :create_search_name
  before_update :sanitize_input

  scope :sorted_list, -> { order(:sort_name, :year) }
  scope :recently_added, -> { order(created_at: :desc) }

  def self.search_title(t,y)
    query = {'api_key' => '29f9cfa4c730839f8828ae772bd7d75a', 'query' => t}
    title_response = HTTParty.get('https://api.themoviedb.org/3/search/movie?api_key=' + ENV['TMDB_KEY'] + '&query=' + t +'&year=' + y)
    if title_response['results'] == []
      return nil
    end
    id = title_response['results'][0]['id'].to_s
    movie_response = HTTParty.get('https://api.themoviedb.org/3/movie/' + id + '?api_key=' + ENV['TMDB_KEY'] + '&append_to_response=credits,releases')
    response = {title: title_response['results'][0]['title'], plot: title_response['results'][0]['overview'], poster: 'https://image.tmdb.org/t/p/w342' +title_response['results'][0]['poster_path'], year: title_response['results'][0]['release_date'].split('-').slice(0,1).join(), actors: get_actors(movie_response), director: get_director(movie_response), genre: get_genres(movie_response), producer: get_producers(movie_response), rating: get_rating(movie_response), runtime: movie_response['runtime'].to_s, writer: get_writers(movie_response)}
  end


  def self.user_count
    self.all.sort_by { |movie| [movie.users.count, movie[:sort_name]] }.reverse![0, 6]
  end

  def get_average
    sum = self.ratings.map(&:stars).inject(:+)
    average = self.ratings.length > 0 ? (sum.to_f / self.ratings.count).round : 0
  end

  def self.filter_movies(t, u)
    title = t.downcase
    user = User.find(u)
    movies = user.movies.where('search_name LIKE ?', "%#{title}%")
  end

  private

    def create_sort_name
      self.sort_name = self.title.gsub(/^(The\b*\W|A\b*\W|An\b*\W)/, '')
    end

    def create_search_name
      self.search_name = self.title.downcase
    end

    def set_image
      self.poster.gsub!(/^(http)/, 'https')
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

    def sanitize_input
      self.title.gsub!(/(\s*\<.*\/.*\>)/, '')
      self.year.gsub!(/\s*\<.*\/.*\>/, '')
      self.rating.gsub!(/\s*\<.*\/.*\>/, '')
      self.plot.gsub!(/\s*\<.*\/.*\>/, '')
      self.actors.gsub!(/\s*\<.*\/.*\>/, '')
      self.director.gsub!(/\s*\<.*\/.*\>/, '')
      self.writer.gsub!(/\s*\<.*\/.*\>/, '')
      self.genre.gsub!(/\s*\<.*\/.*\>/, '')
      self.producer.gsub!(/\s*\<.*\/.*\>/, '')
      self.runtime.gsub!(/\s*\<.*\/.*\>/, '')
      self.poster.gsub!(/\s*\<.*\/.*\>/, '')
      self.sort_name.gsub!(/\s*\<.*\/.*\>/, '')
    end

    def self.get_actors(r)
      actors = []
      r['credits']['cast'].each { |k| actors << k['name'] }
      actors.first(6).join(', ')
    end

    def self.get_director(r)
      director = []
      r['credits']['crew'].each { |k| director << k['name'] if k['job'] == 'Director' }
      director.first(6).join(', ')
    end

    def self.get_genres(r)
      genres = []
      r['genres'].each { |k| genres << k['name'] }
      genres.first(2).join(', ')
    end

    def self.get_producers(r)
      producers = []
      r['credits']['crew'].each { |k| producers << k['name'] if k['job'] == 'Producer' }
      producers.first(6).join(', ')
    end

    def self.get_rating(r)
      rating = ''
      r['releases']['countries'].each { |k| rating = k['certification'] if k['iso_3166_1'] == 'US' }
      rating != '' ? rating : 'NR'
    end

    def self.get_writers(r)
      writers = []
      r['credits']['crew'].each { |k| writers << k['name'] if k['job'] == 'Screenplay' || k['job'] == 'Writer' }
      writers.first(6).join(', ')
    end
end
