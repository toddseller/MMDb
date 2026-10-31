class User < ActiveRecord::Base
  # 'default' is the light theme.
  THEMES = %w[default dark system].freeze
  # 3 to 30 lowercase letters, digits and hyphens, starting and ending with a letter or digit.
  HANDLE = /\A[a-z0-9][a-z0-9-]{1,28}[a-z0-9]\z/

  validates :theme, inclusion: { in: THEMES }
  validates :first_name, :last_name, :user_name, :email, :password_hash, presence: true
  validates :user_name, :email, uniqueness: true
  validates :handle, format: { with: HANDLE }
  validate :handle_free, if: :will_save_change_to_handle?
  # Only a password set on this object is checked; stored ones predate the rule. bcrypt ignores bytes past 72.
  validate :new_password_length, if: -> { @new_password }

  before_save :sanitize_input
  before_validation { self.handle = handle&.downcase }
  before_validation :default_handle, on: :create
  after_update :keep_old_handle, if: :saved_change_to_handle?

  has_and_belongs_to_many :movies, counter_cache: true
  has_and_belongs_to_many :shows, counter_cache: true
  has_many :ratings
  has_many :old_handles, class_name: 'UserHandle'

  # The first free handle made from a user name, numbered on a clash, or one made from the id when the name has too little.
  def self.handle_for(user_name, id, taken)
    base = user_name.to_s.parameterize.gsub(/[^a-z0-9]+/, '-').delete_prefix('-')[0, 30].sub(/-+\z/, '')
    base = "user-#{id}" if base.length < 3

    (1..).lazy.map { |n| n == 1 ? base : "#{base[0, 30 - "-#{n}".length].sub(/-+\z/, '')}-#{n}" }.find { |handle| !taken.include?(handle) }
  end

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
  # The id comes from the sequence before the insert, so a name too short for a handle can use it.
  def default_handle
    return if handle.present?

    self.id ||= self.class.connection.select_value("SELECT nextval('users_id_seq')")
    self.handle = self.class.handle_for(user_name, id, self.class.pluck(:handle) + UserHandle.pluck(:handle))
  end

  def handle_free
    taken = self.class.where(handle: handle).where.not(id: id).exists? || UserHandle.where(handle: handle).where.not(user_id: id).exists?
    errors.add(:handle, 'is taken') if taken
  end

  def keep_old_handle
    old, new = saved_change_to_handle
    old_handles.where(handle: new).delete_all
    old_handles.create!(handle: old)
  end

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
