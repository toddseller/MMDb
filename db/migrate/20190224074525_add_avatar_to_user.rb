class AddAvatarToUser < ActiveRecord::Migration[5.1]
  def change
    change_table :users do |t|
      t.string :avatar, default: ''
    end
  end
end
