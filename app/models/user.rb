class User < ActiveRecord::Base
  # 'default' is the light theme.
  THEMES = %w[default dark system].freeze

  validates :theme, inclusion: { in: THEMES }
  validates :first_name, :last_name, :user_name, :email, :password_hash, presence: true
  validates :user_name, :email, uniqueness: true
  # Only a password set on this object is checked; stored ones predate the rule. bcrypt ignores bytes past 72.
  validate :new_password_length, if: -> { @new_password }

  before_save :sanitize_input

  has_and_belongs_to_many :movies, counter_cache: true
  has_and_belongs_to_many :shows, counter_cache: true
  has_many :ratings

  def self.movie_count
    self.all.sort_by { |user| user.movies.count }.reverse!
  end

  def self.top_users
    users = []
    self.movie_count.each { |u| users << {id: u.id, userName: u.user_name, avatar: u.avatar, movieCount: u.movies.count, showCount: u.shows.count} if u.movies.count >= 10}
    users.first(10)
  end

  def password
    @password ||= BCrypt::Password.new(password_hash)
  end

  def password=(new_password)
    @new_password = new_password.to_s
    @password = BCrypt::Password.create(new_password)
    self.password_hash = @password
  end

  def authenticate(password)
    self.password == password
  end

  # Changes with every password change, since each new hash has a new salt; it can't be used to test guesses.
  def password_fingerprint
    Digest::SHA256.hexdigest(password_hash)
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def sorted
    this.movies
  end

  private
  def new_password_length
    errors.add(:password, 'must be at least 8 characters') if @new_password.length < 8
    errors.add(:password, 'must be at most 72 bytes') if @new_password.bytesize > 72
  end

  def sanitize_input
    self.first_name.gsub!(/(\s*\<.*\/.*\>)/, '')
    self.last_name.gsub!(/(\s*\<.*\/.*\>)/, '')
    self.user_name.gsub!(/(\s*\<.*\/.*\>)/, '')
    self.email.gsub!(/(\s*\<.*\/.*\>)/, '')
  end
end
