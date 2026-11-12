class Season < ActiveRecord::Base

  belongs_to :show
  has_many :episodes

  accepts_nested_attributes_for :show

  # Postgres sorts false before true, so season 0 (specials) comes after the regular seasons.
  scope :sorted_seasons, -> { order(Arel.sql('seasons.season = 0'), :season) }

  # Search results are hashes with the season as a string, so the name is worked out from the number alone.
  def self.label(number) = number.to_s == '0' ? 'Specials' : "Season #{number}"

  def label = Season.label(season)

  def specials? = season == 0

end
