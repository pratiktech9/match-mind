class CreateClientOpportunitySkills < ActiveRecord::Migration[8.0]
  def change
    create_table :client_opportunity_skills do |t|
      t.references :client_opportunity, null: false, foreign_key: true
      t.references :skill, null: false, foreign_key: true
      t.integer :importance, default: 1
      t.boolean :required, default: false

      t.timestamps
    end

    add_index :client_opportunity_skills, [ :client_opportunity_id, :skill_id ], unique: true, name: 'index_client_opp_skills_on_opp_and_skill'
    add_index :client_opportunity_skills, :required
    add_index :client_opportunity_skills, :importance
  end
end
