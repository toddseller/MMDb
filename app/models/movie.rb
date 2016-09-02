class Movie < ActiveRecord::Base

  validates :title, presence: true

  has_and_belongs_to_many :users

  before_create :create_sort_name

  scope :sorted_list, -> { order(:sort_name, :year) }

  def user

  end

  private

    def create_sort_name
      self.sort_name = self.title.gsub(/^(The\b*\W|A\b*\W|An\b*\W)/, '')
    end

    def set_image
      self.poster.gsub!(/^(http)/, 'https')
    end
end
