# Snapshots of what the main pages show for ordinary data, so escaping can't change how they look.
# Rerecord with UPDATE_SNAPSHOTS=1 only when a page is meant to change.
describe 'page text' do
  SNAPSHOTS = APP_ROOT.join('spec', 'fixtures', 'page_text')

  let(:user) { create_user }
  let(:show) do
    create_show(user, title: 'Law & Order', seasons: [1]).tap do |show|
      show.seasons.first.update!(plot: 'Tom &amp; Jerry', is_active: true)
      show.seasons.first.episodes.first.update!(title: 'Pilot & Co', plot: 'A &amp; B', runtime: '45')
    end
  end
  let(:movie) do
    create_movie(user, title: 'Law & Order: The Movie').tap do |movie|
      movie.update!(plot: 'Tom &amp; Jerry ride again', actors: 'Ann Lee, Bo Chen', producer: 'Pat Kim', writer: 'Sam Ray',
                    studio: 'Acme & Sons', runtime: '100', year: '2001', genre: 'Comedy', rating: 'PG', file_name: '',
                    poster: 'https://img.example.test/poster.jpg?w=200&h=300')
    end
  end

  def page_of(response)
    body = JSON.parse(response.body)
    body.is_a?(Hash) ? body['page'] : body
  end

  def snapshot(html)
    doc = Nokogiri::HTML(html)
    ids = [user, show, movie, *show.seasons, *show.seasons.flat_map(&:episodes)].map(&:id).uniq.sort_by(&:-@)
    text = doc.text.squish
    attrs = doc.css('[alt], [src], [data-original], [value]').flat_map do |node|
      %w[alt src data-original value].filter_map { |name| "#{node.name}[#{name}]=#{node[name]}" if node[name] }
    end
    ids.reduce([text, *attrs].join("\n").gsub(/User\d+|user\d+/, 'USER')) { |out, id| out.gsub(/\b#{id}\b/, 'ID') } + "\n"
  end

  def expect_snapshot(name, html)
    path = SNAPSHOTS.join("#{name}.txt")
    File.write(path, snapshot(html)) if ENV['UPDATE_SNAPSHOTS']
    expect(snapshot(html)).to eq File.read(path)
  end

  before { show && movie }

  it('shows page') { expect_snapshot('shows_page', page_of(get("/users/#{user.id}/shows"))) }
  it('movies page') { expect_snapshot('movies_page', page_of(get("/users/#{user.id}"))) }
  it('movie info') { expect_snapshot('movie_info', page_of(get("/users/#{user.id}/movies/#{movie.id}"))) }
  it('show info') { expect_snapshot('show_info', page_of(get("/users/#{user.id}/shows/#{show.id}"))) }

  it 'movie edit form' do
    log_in(user, 'secret')
    expect_snapshot('movie_edit', page_of(get("/users/#{user.id}/movies/#{movie.id}/edit")))
  end

  it 'shows grid after adding episodes' do
    log_in(user, 'secret')
    season = show.seasons.first
    response = post("/users/#{user.id}/shows/#{show.id}/seasons/#{season.id}/episodes", params: { episode: { title: 'Second', tv_episode: '2' } })
    expect_snapshot('shows_grid_after_episodes', page_of(response))
  end
end
