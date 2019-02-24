class User < ActiveRecord::Base

  validates :first_name, :last_name, :user_name, :email, :password_hash, presence: true
  validates :user_name, :email, uniqueness: true

  before_save :sanitize_input

  has_and_belongs_to_many :movies, counter_cache: true
  has_and_belongs_to_many :shows, counter_cache: true
  has_many :ratings

  def self.movie_count
    self.all.sort_by { |user| user.movies.count }.reverse!
  end

  def self.top_users
    users = []
    self.movie_count.each { |u| users << {userName: u.user_name, avatar: u.avatar, movieCount: u.movies.count, showCount: u.shows.count} if u.movies.count >= 10}
    users.first(10)
  end

  def password
    @password ||= BCrypt::Password.new(password_hash)
  end

  def password=(new_password)
    @password = BCrypt::Password.create(new_password)
    self.password_hash = @password
  end

  def authenticate(password)
    self.password == password
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def sorted
    this.movies
  end

  private
  def sanitize_input
    self.first_name.gsub!(/(\s*\<.*\/.*\>)/, '')
    self.last_name.gsub!(/(\s*\<.*\/.*\>)/, '')
    self.user_name.gsub!(/(\s*\<.*\/.*\>)/, '')
    self.email.gsub!(/(\s*\<.*\/.*\>)/, '')
  end
end
