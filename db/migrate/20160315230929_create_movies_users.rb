class CreateMoviesUsers < ActiveRecord::Migration
  def change
    create_table :movies_users, id: false do |t|
      t.belongs_to :movie, index: true
      t.belongs_to :user, index: true
    end
  end
end