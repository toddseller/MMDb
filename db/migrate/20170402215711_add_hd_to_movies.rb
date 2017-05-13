class AddHdToMovies < ActiveRecord::Migration
  def change
    change_table :movies do |t|
      t.boolean :hd, default: true
    end
  end
end
