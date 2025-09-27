class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :provider
      t.string :uid
      t.string :name
      t.string :email
      t.string :role
      t.string :image_url
      t.string :token
      t.datetime :token_expires_at

      t.timestamps
    end
    add_index :users, :uid
    add_index :users, :email
  end
end
