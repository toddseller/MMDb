class AddSearchNameToMovies < ActiveRecord::Migration[5.1]
  def change
    change_table :movies do |t|
      t.string :search_name
    end
  end
end
