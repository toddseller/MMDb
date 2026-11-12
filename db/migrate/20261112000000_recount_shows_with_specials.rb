class RecountShowsWithSpecials < ActiveRecord::Migration[8.1]
  # Specials no longer count as a season; saving reruns Show's add_season_count on the stored seasonNumbers and seasonCount.
  def up
    Show.where(id: Season.where(season: 0).select(:show_id)).find_each(&:save!)
  end

  # The old counts included specials by mistake, so there is nothing worth restoring.
  def down; end
end
