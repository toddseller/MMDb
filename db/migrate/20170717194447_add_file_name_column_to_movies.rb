class AddFileNameColumnToMovies < ActiveRecord::Migration[5.1]
  def change
    add_column :movies, :file_name, :string
  end
end
