class CreateMovies < ActiveRecord::Migration[5.1]
  def change
    create_table :movies do |t|
      t.string :title
      t.string :year
      t.string :rating
      t.text :plot
      t.text :actors
      t.string :director
      t.string :writer
      t.string :genre
      t.string :producer
      t.string :runtime
      t.string :poster
      t.string :sort_name

      t.timestamps null: false
    end
  end
end
