class RenameNewToIsnew < ActiveRecord::Migration[5.1]
  def change
    rename_column :movies, :new, :isnew
  end
end
