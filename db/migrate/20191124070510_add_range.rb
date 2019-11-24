class AddRange < ActiveRecord::Migration[5.1]
  def change
    change_table :seasons do |t|
      t.string :appleTvId
      t.string :skip
      t.string :count
    end
  end
end
