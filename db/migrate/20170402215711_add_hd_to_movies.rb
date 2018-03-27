class AddHdToMovies < ActiveRecord::Migration[5.1]
  def change
    change_table :movies do |t|
      t.boolean :hd, default: true
    end
  end
end
