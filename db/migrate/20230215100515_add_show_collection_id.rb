class AddShowCollectionId < ActiveRecord::Migration[5.1]
  def change
    change_table :shows do |t|
      t.string :show_collection_id
    end
  end
end
