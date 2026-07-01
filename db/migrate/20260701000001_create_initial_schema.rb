class CreateInitialSchema < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :first_name
      t.string :last_name
      t.string :email, null: false
      t.string :avatar_url
      t.string :provider, null: false
      t.string :uid, null: false

      t.timestamps
    end
    add_index :users, :email, unique: true
    add_index :users, %i[provider uid], unique: true

    create_table :projects do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      # Hourly rate for the project, in dollars. Null = not set.
      t.float :hourly_rate

      t.timestamps
    end

    create_table :time_entries do |t|
      t.references :user, null: false, foreign_key: true
      t.references :project, null: false, foreign_key: true
      t.date :date, null: false
      t.float :hours, null: false

      t.timestamps
    end
    # One entry per project per day, so cell edits are an upsert.
    add_index :time_entries, %i[project_id date], unique: true

    create_table :locations do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false

      t.timestamps
    end

    create_table :day_locations do |t|
      t.references :user, null: false, foreign_key: true
      t.references :location, null: false, foreign_key: true
      # One location per day per user.
      t.date :date, null: false

      t.timestamps
    end
    add_index :day_locations, %i[user_id date], unique: true
  end
end
