class AddThemeToUsers < ActiveRecord::Migration[5.1]
  def change
    change_table :users do |t|
      t.string :theme, default: 'default'
    end
  end
end
