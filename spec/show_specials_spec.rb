describe 'a show with specials' do
  let(:user) { create_user }

  def show_with(seasons, active: seasons.max)
    create_show(user, seasons: seasons).tap { |show| show.seasons.find_by(season: active).update!(is_active: true) }
  end

  def drawer(show) = Nokogiri::HTML(JSON.parse(get("/users/#{user.id}/shows/#{show.id}").body))

  context 'in the drawer' do
    it 'names the specials button Specials and puts it last, each button posting its season number' do
      buttons = drawer(show_with([0, 1, 2])).css('.season-submit').map { |button| [button.name, button.text.strip, button['value']] }

      expect(buttons).to eq [%w[button 1 1], %w[button 2 2], %w[button Specials 0]]
    end

    it 'counts the regular seasons and every episode' do
      page = drawer(show_with((0..14).to_a))

      expect([page.at_css('#counts').text, page.at_css('#series-count').text]).to eq ['14 seasons, 15 episodes', '14 seasons']
    end

    it 'names the one regular season beside the specials' do
      page = drawer(show_with([0, 3]))

      expect([page.at_css('#counts').text, page.at_css('#series-count').text]).to eq ['1 season, 2 episodes', 'Season 3']
    end

    it 'reads Specials for a show with only specials' do
      page = drawer(show_with([0]))

      expect([page.at_css('#counts').text, page.at_css('#series-count').text]).to eq ['Specials, 1 episode', 'Specials']
    end

    it "switches to the specials when the owner clicks Specials" do
      show = show_with([0, 1], active: 1)
      show.seasons.find_by(season: 0).update!(poster: "https://image.tmdb.org/t/p/original/specials.jpg")
      log_in(user, "secret-password")

      post("/users/#{user.id}/shows/#{show.id}/seasons/0")

      expect(show.seasons.find_by(is_active: true).season).to eq 0
      expect(show.reload.poster).to eq "https://image.tmdb.org/t/p/original/specials.jpg"
    end
  end

  context "elsewhere" do
    include ShowSearchStubs

    before { log_in(user, "secret-password") }

    it "heads the edit dialog Specials and keeps the stored number in the season field" do
      show = show_with([0, 1], active: 0)

      dialog = Nokogiri::HTML(JSON.parse(get("/users/#{user.id}/shows/#{show.id}/edit").body))

      expect([dialog.at_css(".show-title p").text, dialog.at_css("input#season")["value"]]).to eq ["Specials, 1 episode selected", "0"]
    end

    it "labels a stored season 0 Specials in the Add TV Show results" do
      create_show(user, title: "Harbor Lights", seasons: [0, 1])
      stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?}).to_return(json(data: { canvas: { shelves: [] } }))
      stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/tv\?}).to_return(json(results: []))

      results = Nokogiri::HTML(JSON.parse(get("/shows?query=harbor").body)["page"])

      expect(results.css("#year").map(&:text)).to contain_exactly("Season 1", "Specials")
    end
  end
end

%w[v2 v3].each do |version|
  describe "/api/#{version}/add_show for a show with specials" do
    it 'counts only the regular seasons' do
      user = create_user
      show = create_show(user, seasons: (0..13).to_a)
      show.update!(show_collection_id: 'harbor')
      token = { 'HTTP_AUTHORIZATION' => "bearer #{JwtAuth.token(user, lifetime: JwtAuth::SESSION_LIFETIME)}" }

      reply = post("/api/#{version}/add_show", json: { show: { title: show.title, show_collection_id: 'harbor', collectionId: 'harbor-14', season: 14 } }, env: token)

      expect(JSON.parse(reply.body).slice('seasonCount', 'seasonNumbers')).to eq('seasonCount' => 14, 'seasonNumbers' => 14)
    end
  end
end
