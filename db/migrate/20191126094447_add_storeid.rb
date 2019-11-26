class AddStoreid < ActiveRecord::Migration[5.1]
  def change
    change_table :seasons do |t|
      t.string :storeId
    end
  end
end
