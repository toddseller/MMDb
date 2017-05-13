class AddNewToMovies < ActiveRecord::Migration[5.1]
  def change
    change_table :movies do |t|
      t.boolean :new, default: true
    end
  end
end
