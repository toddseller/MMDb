require_relative 'request_helper'

# The other two responses that re-render the show grid: adding episodes and adding a show.
describe 'responses that re-render the show grid' do
  def owner_with_shows(name, count)
    user = User.create!(first_name: name, last_name: 'Test', user_name: name, email: "#{name}@example.test", password: 'secret')
    count.times do |i|
      show = Show.create!(title: "#{name} show #{i}", poster: "https://is1-ssl.mzstatic.com/image/thumb/#{name}#{i}/600x600.jpg")
      [1, 2, 3].each { |n| show.seasons.create!(season: n) }
      user.shows << show
    end
    log_in(user, 'secret')
    user
  end

  def grid(response)
    Nokogiri::HTML(JSON.parse(response.body)['page']).css('img')
  end

  describe 'POST /users/:user_id/shows/:show_id/seasons/:season_id/episodes' do
    def add_episode(user)
      show = user.shows.first
      season = show.seasons.first
      post("/users/#{user.id}/shows/#{show.id}/seasons/#{season.id}/episodes",
           params: { episode: { title: 'Pilot', tv_episode: '1' } })
    end

    it 'issues the same number of queries for 2 shows as for 10' do
      small = owner_with_shows('small', 2)
      small_count = queries { add_episode(small) }.size
      large = owner_with_shows('large', 10)
      expect(queries { add_episode(large) }.size).to eq small_count
    end

    it 'defers grid posters at thumbnail size' do
      images = grid(add_episode(owner_with_shows('posters', 2)))
      expect(images.size).to eq 2
      expect(images.map { |img| img['class'] }).to all eq 'lazy'
      expect(images.map { |img| img['data-original'] }).to all end_with '/400x400.jpg'
    end
  end

  describe 'POST /shows with new set' do
    # An existing show and season, so the route makes no external API calls.
    def add_show(user)
      show = user.shows.first
      show.update!(show_collection_id: "collection-#{show.id}")
      season = show.seasons.first
      season.update!(collectionId: "season-#{season.id}")
      post('/shows', params: {
        new: 'true',
        show: { show_collection_id: show.show_collection_id, title: show.title },
        season: { collectionId: season.collectionId, season: season.season.to_s },
        episode: { title: 'Pilot', tv_episode: '1' }
      })
    end

    it 'issues the same number of queries for 2 shows as for 10' do
      small = owner_with_shows('small', 2)
      small_count = queries { add_show(small) }.size
      large = owner_with_shows('large', 10)
      expect(queries { add_show(large) }.size).to eq small_count
    end

    it 'loads grid posters lazily at thumbnail size' do
      images = grid(add_show(owner_with_shows('posters', 2)))
      expect(images.size).to eq 2
      expect(images.map { |img| img['loading'] }).to all eq 'lazy'
      expect(images.map { |img| img['src'] }).to all end_with '/400x400.jpg'
      expect(images.map { |img| img['data-original'] }).to all end_with '/400x400.jpg'
    end
  end
end
