class AddStudioToMovies < ActiveRecord::Migration[5.1]
  def change
    change_table :movies do |t|
      t.string :studio, default: ''
    end
  end
end
