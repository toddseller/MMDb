class AddHandlesToUsers < ActiveRecord::Migration[8.1]
  # Today's User expects the column this adds, so the backfill uses the table without its validations or callbacks.
  class BareUser < ActiveRecord::Base
    self.table_name = 'users'
  end

  def up
    add_column :users, :handle, :string
    taken = []
    BareUser.order(:id).each do |user|
      taken << User.handle_for(user.user_name, user.id, taken)
      user.update_columns(handle: taken.last)
    end
    change_column_null :users, :handle, false
    add_index :users, :handle, unique: true

    create_table :user_handles do |t|
      t.string :handle, null: false
      t.references :user, type: :integer, null: false, foreign_key: { on_delete: :cascade }
      t.timestamps
    end
    add_index :user_handles, :handle, unique: true
  end

  def down
    drop_table :user_handles
    remove_column :users, :handle
  end
end
