class Episode < ActiveRecord::Base

  validates :title, presence: true

  belongs_to :seasons, -> { order(:tv_episode) }

  before_create :create_duration
  # before_save :update_duration


  scope :sorted_list, -> { order(:tv_episode) }

  def self.episode_count(u)
    user = User.find(u)
    episodes = []
    user.shows.each do |show|
      show.seasons.each {|season| episodes << season.episodes.count}
    end
    episodes.reduce(:+).to_s.reverse.gsub(/(\d{3})(?=\d)/, '\1,').reverse
  end

  private

  def create_duration
    time = self.runtime.to_i
    hour = time.round / 60
    min = time % 60
    if hour != 0 && min > 0
      p self.runtime = hour.to_s + 'h ' + min.to_s + 'm'
    elsif hour != 0 && min == 0
      self.runtime = hour.to_s + ' hr'
    else
      self.runtime = min.to_s + ' min'
    end
  end

  # def update_duration
  #   if self.runtime.include? 'hour'
  #     if self.runtime.include? '0'
  #       self.runtime = self.runtime.gsub(/hours?.*/, 'hr')
  #     else
  #       duration = self.runtime.gsub(/\shours?,/, 'h')
  #       duration = duration.gsub(/\sminutes?/, 'm')
  #       self.runtime = duration
  #     end
  #   elsif self.runtime.include? 'minute'
  #     self.runtime = self.runtime.gsub(/minutes?/, 'min')
  #   end
  # end
end
