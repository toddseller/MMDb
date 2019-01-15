class AddDirectorCheckToMovies < ActiveRecord::Migration[5.1]
  def change
    change_table :movies do |t|
      t.string :director_check, default: ''
    end
  end
end
