class CreateShows < ActiveRecord::Migration[5.1]
  def change
    create_table :shows do |t|
      t.string :title
      t.string :poster
      t.string :year
      t.string :rating
      t.string :genre
      t.string :sort_name
      t.string :search_name
      t.integer :hd, default: 1080

      t.timestamps null: false
    end
  end
end
