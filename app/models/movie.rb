class Movie < ActiveRecord::Base

  validates :title, presence: true

  has_and_belongs_to_many :users

  before_save :create_sort_name, :set_image

  scope :sorted_list, -> { order(:sort_name, :year) }

  private

    def create_sort_name
      self.sort_name = self.title.gsub(/^(The\b*\W|A\b*\W|An\b*\W)/, '')
    end

    def set_image
      if self.poster == 'N/A'
        self.poster = 'http://mmdb.online/imgs/default_image.png'
      end
    end
end
