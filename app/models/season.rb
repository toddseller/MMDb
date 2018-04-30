class Season < ActiveRecord::Base

  belongs_to :show
  has_many :episodes

  scope :sorted_seasons, -> { order(:season) }

end
