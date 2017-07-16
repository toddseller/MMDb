class ChangeDataTypeOfHdInMovies < ActiveRecord::Migration[5.1]
  def self.up
    add_column :movies, :hd_tmp, :integer, :default => 1

    Movie.reset_column_information
    Movie.where(:hd => false).update_all(:hd_tmp => 0)

    remove_column :movies, :hd
    remove_column :movies, :hd_temp
    rename_column :movies, :hd_tmp, :hd
  end

  def self.down
  end
end
