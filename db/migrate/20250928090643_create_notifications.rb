class CreateNotifications < ActiveRecord::Migration[8.0]
  def change
    create_table :notifications do |t|
      t.string :title
      t.text :message
      t.string :notification_type
      t.string :priority
      t.string :status
      t.references :engineer, null: true, foreign_key: true
      t.references :client, null: true, foreign_key: true
      t.references :client_opportunity, null: true, foreign_key: true
      t.datetime :read_at

      t.timestamps
    end

    add_index :notifications, [ :notification_type, :status ]
    add_index :notifications, [ :priority, :status ]
    add_index :notifications, :read_at
    add_index :notifications, :created_at
  end
end
