class RenameSeasonCountsAndSeasonNumbers < ActiveRecord::Migration[5.1]
  def change
    rename_column :shows, :season_numbers, :seasonNumbers
    rename_column :shows, :season_count, :seasonCount
  end
end
