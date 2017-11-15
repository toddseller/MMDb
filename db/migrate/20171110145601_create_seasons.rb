class CreateSeasons < ActiveRecord::Migration[5.1]
  def change
    create_table :seasons do |t|
      t.integer :season
      t.text :plot
      t.string :poster
      t.string :collectionId
      t.string :collectionName
      t.boolean :is_active
      t.belongs_to :show, index: true

      t.timestamps null: false
    end
  end
end
