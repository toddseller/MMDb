class AddSearchNameToMovies < ActiveRecord::Migration
  def change
    change_table :movies do |t|
      t.string :search_name
    end
  end
end
