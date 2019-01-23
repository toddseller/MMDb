class Season < ActiveRecord::Base

  belongs_to :show
  has_many :episodes

  accepts_nested_attributes_for :show

  scope :sorted_seasons, -> { order(:season) }

end
