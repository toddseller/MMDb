module Factories
  def self.next_number
    @number = @number.to_i + 1
  end

  def create_user(password: 'secret-password')
    n = Factories.next_number
    User.create!(first_name: "User#{n}", last_name: 'Test', user_name: "user#{n}", email: "user#{n}@example.test", password: password)
  end

  def create_show(user, title: "Show #{Factories.next_number}", seasons: [1, 2, 3])
    show = Show.create!(title: title, poster: "https://is1-ssl.mzstatic.com/image/thumb/#{title.parameterize}/600x600.jpg")
    seasons.each do |number|
      show.seasons.create!(season: number).episodes.create!(title: "#{title} #{number}x1", tv_episode: 1)
    end
    user.shows << show
    show
  end

  # Movie#create_director_check splits the director, so it can't be nil.
  def create_movie(user, title: "Movie #{Factories.next_number}")
    movie = Movie.create!(title: title, director: 'Jane Doe')
    user.movies << movie
    movie
  end
end

RSpec.configure { |config| config.include Factories }
