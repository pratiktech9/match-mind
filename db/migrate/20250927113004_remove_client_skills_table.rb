class RemoveClientSkillsTable < ActiveRecord::Migration[8.0]
  def up
    drop_table :client_skills
  end

  def down
    create_table :client_skills do |t|
      t.bigint :client_id, null: false
      t.bigint :skill_id, null: false
      t.integer :importance
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
      t.index [ :client_id ], name: "index_client_skills_on_client_id"
      t.index [ :skill_id ], name: "index_client_skills_on_skill_id"
    end
    add_foreign_key :client_skills, :clients
    add_foreign_key :client_skills, :skills
  end
end
