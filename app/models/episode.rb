class Episode < ActiveRecord::Base

  validates :title, presence: true

  belongs_to :seasons

  before_create :create_duration

  scope :sorted_list, -> { order(:tv_episode) }

  private

  def create_duration
    time = self.runtime.to_i
    hour = time.round / (1000 * 60 * 60)
    min = time / (1000 * 60) % 60
    if hour == 1
      self.runtime = hour.to_s + ' hour, ' + min.to_s + ' minutes'
    elsif hour > 1
      self.runtime = hour.to_s + ' hours, ' + min.to_s + ' minutes'
    else
      self.runtime = min.to_s + ' minutes'
    end
  end
end
