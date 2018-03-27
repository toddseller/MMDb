class AddDefaultValueToFileName < ActiveRecord::Migration[5.1]
  def change
    change_column :movies, :file_name, :string, :default => ''
  end
end
