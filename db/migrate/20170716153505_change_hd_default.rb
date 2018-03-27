class ChangeHdDefault < ActiveRecord::Migration[5.1]
  def self.up
    change_column_default :movies, :hd, 1080

    Movie.reset_column_information
    Movie.where(:hd => 1).update_all(:hd => 1080)
    Movie.where(:hd => 2).update_all(:hd => 720)
  end
end
