describe 'the letter rail' do
  let(:user) { create_user }

  def rail_links(html) = Nokogiri::HTML(html).css('nav[aria-label="Jump to letter"] a')

  {
    "a user's movies" => ->(id) { "/users/#{id}" },
    "a user's shows" => ->(id) { "/users/#{id}/shows" },
    "a movie collection's own page" => ->(id) { "/users/#{id}/movies" }
  }.each do |name, path|
    it "is on #{name}, # then A to Z" do
      links = rail_links(get(path.call(user.id), xhr: false).body)
      expect(links.map(&:text)).to eq ['#', *'A'..'Z']
      expect(links.map { |link| link['data-letter'] }).to eq ['#', *'a'..'z']
    end
  end

  it 'is not on the home page' do
    expect(rail_links(get('/', xhr: false).body)).to be_empty
  end
end

describe 'letter rail letters on grid tiles' do
  let(:user) { create_user }

  def letters(html, tile)
    Nokogiri::HTML(html).css(tile).to_h { |node| [node.at_css('p').text, node['data-letter']] }
  end

  def page(response) = JSON.parse(response.body)['page']

  describe 'movie tiles' do
    before do
      create_movie(user, title: 'The Matrix')
      create_movie(user, title: '12 Angry Men')
    end

    let(:expected) { { 'The Matrix' => 'm', '12 Angry Men' => '#' } }

    it 'are lettered on the movies page' do
      expect(letters(get("/users/#{user.id}", xhr: false).body, '.index-preview')).to eq expected
    end

    it "are lettered on a movie collection's own page" do
      expect(letters(get("/users/#{user.id}/movies", xhr: false).body, '.index-preview')).to eq expected
    end

    it 'are lettered in a title search' do
      response = get('/movies/filter', params: { id: user.id, filter: 'a' })
      expect(letters(page(response), '.index-preview')).to eq expected
    end
  end

  describe 'show tiles' do
    # The edit dialog saves a sort name as typed, so it can start with a capital.
    let!(:picard) { create_show(user, title: 'Star Trek: Picard').tap { |show| show.update_column(:sort_name, 'Picard') } }

    before { create_show(user, title: 'The Expanse') }

    let(:expected) { { 'Star Trek: Picard' => 'p', 'The Expanse' => 'e' } }

    it 'are lettered on the shows page' do
      expect(letters(page(get("/users/#{user.id}/shows")), '.index-preview-show')).to eq expected
    end

    it 'are lettered in the grid returned after adding episodes' do
      log_in(user, 'secret-password')
      response = post("/users/#{user.id}/shows/#{picard.id}/seasons/#{picard.seasons.first.id}/episodes",
                      params: { episode: { title: 'Pilot', tv_episode: '2' } })
      expect(letters(page(response), '.index-preview-show')).to eq expected
    end

    # An existing show and season, so the route makes no external API calls.
    it 'are lettered in the grid returned after adding a show' do
      picard.update!(show_collection_id: "collection-#{picard.id}")
      season = picard.seasons.first
      season.update!(collectionId: "season-#{season.id}")
      log_in(user, 'secret-password')
      response = post('/shows', params: {
        new: 'true',
        show: { show_collection_id: picard.show_collection_id, title: picard.title },
        season: { collectionId: season.collectionId, season: season.season.to_s },
        episode: { title: 'Pilot', tv_episode: '2' }
      })
      expect(letters(page(response), '.index-preview-show')).to eq expected
    end
  end
end
