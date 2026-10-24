# Loads known data into the browser tests' own database before each run.
# Usage: bundle exec ruby e2e/seed.rb
ENV['RACK_ENV'] ||= 'test'
ENV['DATABASE_URL'] = 'postgres://localhost/MMDb_e2e'
require_relative '../spec/support/test_env'
require_relative '../config/environment'

# Same schema source as the RSpec suite: the migrations don't build production's schema.
unless ActiveRecord::Base.connection.table_exists?(:shows)
  system('psql', '-q', '-o', File::NULL, '-v', 'ON_ERROR_STOP=1', '-d', DB_NAME, '-f', APP_ROOT.join('db', 'structure.sql').to_s, exception: true)
end

tables = ActiveRecord::Base.connection.tables - %w[schema_migrations ar_internal_metadata]
ActiveRecord::Base.connection.execute("TRUNCATE #{tables.map { |t| %("#{t}") }.join(', ')} RESTART IDENTITY CASCADE")

# A test value, not a real credential; the browser tests sign in with it.
user = User.create!(first_name: 'Edie', last_name: 'Tester', user_name: 'e2e', email: 'e2e@example.test', password: 'e2e-password')

apple = ->(slug) { "https://is1-ssl.mzstatic.com/image/thumb/#{slug}/2000x3000.jpg" }

# Enough for several rows of 7. Each data-changing test has its own movie, so test order doesn't matter.
titles = %w[Amber Birch Cedar Delta Ember Fable Garnet Harbor Indigo Juniper Kestrel Lantern Meadow Nimbus Orchid
            Pebble Quartz Raven Saffron Thistle Umber Velvet Willow Xenon Yarrow Zephyr]
titles += ['Edit Target', 'Rate Target', 'Delete Target', 'Ultra Sharp']
titles.each_with_index do |title, i|
  # The details view expects every credit field as a string, as real movies have.
  movie = Movie.create!(title: title, year: (1990 + i).to_s, director: 'Jane Doe', actors: 'Ann Lee, Bo Chen', writer: 'Sam Ray', producer: 'Pat Kim',
                        plot: "#{title} is a seeded movie.", genre: 'Drama', rating: 'PG', runtime: '95',
                        poster: apple.call(title.parameterize), isnew: false, hd: title == 'Ultra Sharp' ? 4 : 1080)
  user.movies << movie
end
Movie.find_by!(title: 'Cedar').update_columns(isnew: true)

show = Show.create!(title: 'Harbor Lights', year: '2019', show_collection_id: '999', poster: 'https://is1-ssl.mzstatic.com/image/thumb/harbor-lights/600x600.jpg')
[1, 2, 3].each do |number|
  # A show's details open on its active season, as every real show has one.
  season = show.seasons.create!(season: number, collectionName: "Harbor Lights, Season #{number}", collectionId: "tmdb999#{number}", is_active: number == 1)
  season.episodes.create!(title: "Harbor Lights #{number}x1", tv_episode: 1)
end
user.shows << show

# The real search asks Apple and TMDB, which the tests can't reach. Record what the app renders for a canned
# result instead, so the browser test answers the search with markup from the real _preview partial.
def Movie.get_titles(_title)
  [{ title: 'Nova Drift', year: '2024', rating: 'PG-13', director: 'Ida Moss', writer: 'Lee Park', producer: 'Ray Cole',
     studio: 'North', genre: 'Science Fiction', runtime: '110', actors: 'Ana Ruiz, Ben Ode', plot: 'Nova Drift is a searched movie.',
     poster: 'https://is1-ssl.mzstatic.com/image/thumb/nova-drift/2000x3000.jpg' }]
end
app = Rack::MockRequest.new(Rack::Builder.parse_file(APP_ROOT.join('config.ru').to_s))
cookie = app.post('/sessions', params: { username_email: user.email, password: 'e2e-password' }, 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest')['set-cookie'].split(';').first
search = app.get('/movies?query=nova', 'HTTP_COOKIE' => cookie, 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest')
raise "recording the movie search failed: #{search.status}" unless search.ok?
generated = APP_ROOT.join('e2e', '.generated')
FileUtils.mkdir_p(generated)
File.write(generated.join('movie_search.json'), search.body)

# Adding an episode starts with a show search (Apple and TMDB) and a season pick (TMDB episode lists).
# Both are recorded the same way; the episode itself is then added by the real app.
def Show.get_series(_title)
  [{ title: 'Harbor Lights', year: '2019', rating: 'TV-14', genre: 'Drama', season: '1', plot: 'Season one.',
     poster: 'https://is1-ssl.mzstatic.com/image/thumb/harbor-lights/600x600.jpg', show_collection_id: '999',
     collectionId: 'tmdb9991', collectionName: 'Harbor Lights, Season 1', skip: '', count: '2', appleTvId: '', storeId: '' }]
end
def Show.get_episodes(*)
  [{ title: 'Harbor Lights 1x2', date: 'Jan 8, 2019', plot: 'The second episode.', preview: '', runtime: '45', tv_episode: 2 }]
end
xhr = { 'HTTP_COOKIE' => cookie, 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest' }
show_search = app.get('/shows?query=harbor', xhr)
raise "recording the show search failed: #{show_search.status}" unless show_search.ok?
File.write(generated.join('show_search.json'), show_search.body)
# Post exactly what the recorded season form holds, as the browser would.
form = Nokogiri::HTML(JSON.parse(show_search.body)['page']).at_css('form#create-show')
season_pick = app.post(form['action'], xhr.merge(params: form.css('input[type=hidden]').to_h { |input| [input['name'], input['value']] }))
raise "recording the season pick failed: #{season_pick.status}" unless season_pick.ok?
File.write(generated.join('show_episodes.json'), season_pick.body)

puts "seeded #{DB_NAME}: user #{user.email}, #{user.movies.count} movies, #{user.shows.count} show"
