class CreateClientSkills < ActiveRecord::Migration[8.0]
  def change
    create_table :client_skills do |t|
      t.references :client, null: false, foreign_key: true
      t.references :skill, null: false, foreign_key: true
      t.integer :importance

      t.timestamps
    end
  end
end
