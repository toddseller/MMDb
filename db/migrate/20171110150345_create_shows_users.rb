class CreateShowsUsers < ActiveRecord::Migration[5.1]
  def change
    create_table :shows_users, id: false do |t|
      t.belongs_to :show, index: true
      t.belongs_to :user, index: true
    end
  end
end
