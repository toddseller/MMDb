class AddPlexKeyToMoviesAndShows < ActiveRecord::Migration[8.1]
  def change
    add_column :movies, :plex_key, :integer
    add_index :movies, :plex_key
    add_column :shows, :plex_key, :integer
    add_index :shows, :plex_key
  end
end
