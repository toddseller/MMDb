class Movie < ActiveRecord::Base

  validates :title, presence: true

  has_and_belongs_to_many :users

  before_create :create_sort_name
  before_save :create_search_name

  scope :sorted_list, -> { order(:sort_name, :year) }
  scope :recently_added, -> { order(created_at: :desc) }

  def self.user_count
    self.all.sort_by { |movie| [movie.users.count, movie[:title]] }.reverse![0, 6]
  end

  private

    def create_sort_name
      self.sort_name = self.title.gsub(/^(The\b*\W|A\b*\W|An\b*\W)/, '')
    end

    def create_search_name
      self.search_name = self.title.downcase
    end

    def set_image
      self.poster.gsub!(/^(http)/, 'https')
    end
end
