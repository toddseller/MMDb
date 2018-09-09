class AddUserCountToMovie < ActiveRecord::Migration[5.1]
  def change
    change_table :movies do |t|
      t.integer :user_count
    end
  end
end
