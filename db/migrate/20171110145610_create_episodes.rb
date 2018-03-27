class CreateEpisodes < ActiveRecord::Migration[5.1]
  def change
    create_table :episodes do |t|
      t.string :title
      t.string :date
      t.text :plot
      t.string :runtime
      t.integer :tv_episode
      t.string :preview
      t.belongs_to :season, index: true

      t.timestamps null: false
    end
  end
end
