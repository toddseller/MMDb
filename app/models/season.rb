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

  # Only blanks are filled, so a hand edit survives the same episode being added again.
  # Episode#create_duration stores a missing runtime as "0 min", so that counts as blank too.
  def add_episode(attrs)
    attrs = attrs.to_h.with_indifferent_access
    episode = episodes.find_or_initialize_by(tv_episode: attrs[:tv_episode])
    attrs.each { |name, value| episode[name] = value if value.present? && (episode[name].blank? || episode[name] == '0 min') }
    episode.save
    episode
  end

end
