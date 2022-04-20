class Movie < ActiveRecord::Base


  validates :title, presence: true

  has_and_belongs_to_many :users
  has_many :ratings

  before_create :create_sort_name
  before_create :create_duration
  before_save :create_search_name
  before_save :create_director_check
  before_save :update_user_count
  # before_update :sanitize_input
  before_update :adjust_url

  scope :sorted_list, -> {order(:sort_name, :year)}
  scope :recently_added, -> {order(created_at: :desc)}
  scope :top_movies, -> {order(user_count: :desc)}

  def self.get_titles(t)
    movie_array = Movie.where("search_name LIKE ?", "%#{t}%").sorted_list.first(10)
    movie_response = appletv_call(t)

    if movie_response.length > 0
      movie_response.each do |m|
        movie_array << m if movie_array.all? {|el| el[:title] != m[:title] && el[:year] != m[:year] || el[:director_check] != m[:director_check]}
      end
    end

    title_response = HTTParty.get('https://api.themoviedb.org/3/search/movie?api_key=' + ENV['TMDB_KEY'] + '&query=' + t)

    return movie_array.sort_by {|k| k[:year]} if title_response['results'] == []
    title_response['results'].each do |movie|
      movie_response = HTTParty.get('https://api.themoviedb.org/3/movie/' + movie['id'].to_s + '?api_key=' + ENV['TMDB_KEY'] + '&append_to_response=credits,releases')
      if movie_response.code == 200 && movie['poster_path'] != nil
        year = movie_response['release_date'] != nil && movie_response['release_date'] != '' ? movie['release_date'].split('-').slice(0, 1).join() : ''
        runtime = movie_response['runtime'] != nil ? movie_response['runtime'].to_s : '0'
        title = movie['title']
        plot = get_plot(movie['overview'])
        poster = 'https://image.tmdb.org/t/p/w342' + movie['poster_path']
        director = get_director(movie_response)
        genre = get_genres(movie_response)
        rating = get_rating(movie_response)
        studio = get_studio(movie_response)
        director_check = director != '' ? director.split(' ').slice(-1, 1).join() : ''
        test_movie = {title: title, plot: plot, poster: poster, year: year, actors: get_actors(movie_response), director: director, genre: genre, producer: get_producers(movie_response), rating: rating, runtime: runtime, studio: studio, writer: get_writers(movie_response), director_check: director_check}
        movie_array << test_movie if movie_array.all? {|el| el[:title] != test_movie[:title] && el[:year] != year || el[:director_check] != test_movie[:director_check]}
      end
    end
    movie_array.sort_by {|k| k[:year]}
  end

  def self.plex_count()
    plex_response = HTTParty.get('http://onyxwear.duckdns.org:8181/api/v2?apikey=' + ENV['TAUTULLI_KEY'] + '&cmd=get_library&section_id=1')
    plex_response['response']['data']['count']
  end

  def self.update_title_search(t)
    movie_array = []
    movie_response = appletv_call(t)

    if movie_response.length > 0
      movie_response.each do |m|
        movie_array << m
      end
    end

    title_response = HTTParty.get('https://api.themoviedb.org/3/search/movie?api_key=' + ENV['TMDB_KEY'] + '&query=' + t)

    return nil if title_response['results'] == []
    title_response['results'].each do |movie|
      movie_response = HTTParty.get('https://api.themoviedb.org/3/movie/' + movie['id'].to_s + '?api_key=' + ENV['TMDB_KEY'] + '&append_to_response=credits,releases')
      if movie_response.code == 200 && movie['poster_path'] != nil
        year = movie_response['release_date'] != nil && movie_response['release_date'] != '' ? movie['release_date'].split('-').slice(0, 1).join() : ''
        runtime = movie_response['runtime'] != nil ? movie_response['runtime'].to_s : '0'
        title = movie['title']
        plot = get_plot(movie['overview'])
        poster = 'https://image.tmdb.org/t/p/w342' + movie['poster_path']
        director = get_director(movie_response)
        genre = get_genres(movie_response)
        rating = get_rating(movie_response)
        studio = get_studio(movie_response)
        director_check = director != '' ? director.split(' ').slice(-1, 1).join() : ''
        test_movie = {title: title, plot: plot, poster: poster, year: year, actors: get_actors(movie_response), director: director, genre: genre, producer: get_producers(movie_response), rating: rating, runtime: runtime, studio: studio, writer: get_writers(movie_response), director_check: director_check}
        movie_array << test_movie if movie_array.all? {|el| el[:title] != test_movie[:title] && el[:year] != year || el[:director_check] != test_movie[:director_check]}
      end
    end
    movie_array.sort_by {|k| k[:year]}
  end

  def self.search_person(n)
    person_response = HTTParty.get('https://api.themoviedb.org/3/search/person?api_key=' + ENV['TMDB_KEY'] + '&query=' + n)
    person_response['results'].length
    person_response['results'].length == 0 || person_response['results'][0]['profile_path'] == nil ? nil : 'https://image.tmdb.org/t/p/w342' + person_response['results'][0]['profile_path']
  end

  # def self.user_count
  #   self.all.sort_by { |movie| [movie.users.count, movie[:sort_name]] }.reverse![0, 6]
  # end
  def self.basic_info(u)
    movies_list = []
    u.movies.sorted_list.each { |movie| movies_list << {id: movie.id, title: movie.title, sort_name: movie.sort_name, search_name: movie.search_name, poster: movie.poster, year: movie.year, isnew: movie.isnew} }
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
    self.sort_name = self.title.gsub(/^(The\b*\W|A\b*\W|An\b*\W)/, '')
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

  def adjust_url
    if self.poster =~ /http:/ && !(self.poster =~ /-ssl.mzstatic/)
      self.poster.gsub!(/^(http)/, 'https')
      self.poster.gsub!(/(\.mzstatic)/, '-ssl.mzstatic')
    end
  end

  def self.get_itunes_info_by_title(a, n, e)
    t = a.detect {|x| x[:title] == n}
    t[e]
  end

  def self.get_itunes_info_by_year(a, y, e)
    t = a.detect {|x| x[:year] == y}
    t[e]
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

  def self.itunes_info(r)
    info = []
    r.each {|i| info << i.text.gsub(/\n\s*/, '')}
    info.length != 0 ? info.first(6).join(', ') : ''
  end

  def self.itunes_studio(r)
    r.include?(';') ? r.split(';').first(1).join() : r.include?(',') ? r.split(',').first(1).join() : r.include?(':') ? r.split(':').first(1).join() : r
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

  def self.appletv_call(s_term)
    movies = []
    storeIds = ['143441', '143444', '143455', '143460']

    storeIds.each do |store|
     response = HTTParty.get('https://uts-api.itunes.apple.com/uts/v2/search/incremental?sf=' + store + '&locale=EN&utsk=0&caller=wta&v=36&pfm=web&q=' + s_term)

      if response['data']['canvas'] != nil
        response['data']['canvas']['shelves'].each do |movie|
          if movie['items'].length > 0
            movie['items'].each do |m|
              if m['type'] == 'Movie'
                request = HTTParty.get('https://uts-api.itunes.apple.com/uts/v2/view/product/' + m['id'] + '?sf=' + store + '&locale=EN&utsk=0&caller=wta&v=36&pfm=web')
                content = request['data']['content']
                credits = request['data']['roles'] ? request['data']['roles'] : []
                actors = []
                director = []
                producer = []
                writer = []
                credits.each do |credit|
                  case credit['type']
                  when 'Actor'
                    actors << credit['personName'].gsub(/^[[:space:]]/, '').gsub(/[[:space:]]$/, '')
                  when 'Voice'
                    actors << credit['personName'].gsub(/^[[:space:]]/, '').gsub(/[[:space:]]$/, '')
                  when 'Director'
                    director << credit['personName'].gsub(/^[[:space:]]/, '').gsub(/[[:space:]]$/, '')
                  when 'Producer'
                    producer << credit['personName'].gsub(/^[[:space:]]/, '').gsub(/[[:space:]]$/, '')
                  when 'Writer'
                    writer << credit['personName'].gsub(/^[[:space:]]/, '').gsub(/[[:space:]]$/, '')
                  else
                    puts "not matching"
                  end
                end
                title = content['title']
                plot = content['description'] ? get_plot(content['description']) : ''
                year = content['releaseDate'] ? Time.at(content['releaseDate'] / 1000).to_datetime.year.to_s : ''
                poster = content['images']['coverArt'] ? content['images']['coverArt']['url'].gsub(/({w}x{h}.{f})/, content['images']['coverArt']['width'].to_s + 'x' + content['images']['coverArt']['height'].to_s + '.jpg') : ''
                genre = content['genres'] ? content['genres'][0]['name'] : ''
                rating = content['rating'] ? content['rating']['displayName'] : ''
                runtime = content['duration'] ? (content['duration'] / 60).to_s : ''
                studio = content['studio'] ? content['studio'] : ''
                director_check = director.length > 0 ? director[0].split(' ').slice(-1, 1).join() : ''

                movies << {title: title, plot: plot, poster: poster, year: year, actors: get_first_six(actors), director: get_first_six(director), genre: genre, producer: get_first_six(producer), rating: rating, runtime: runtime, studio: studio, writer: get_first_six(writer), director_check: director_check} if movies.all? {|el| el[:title] != title && el[:year] != year || el[:director_check] != director_check}
              end
            end
          end
        end
      end
    end
    return movies
  end
end
