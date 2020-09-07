class AddSeasonCounts < ActiveRecord::Migration[5.1]
  def change
    change_table :shows do |t|
      t.string :season_numbers
      t.string :season_count
    end
  end
end
