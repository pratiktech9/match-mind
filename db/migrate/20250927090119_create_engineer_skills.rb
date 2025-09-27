class CreateEngineerSkills < ActiveRecord::Migration[8.0]
  def change
    create_table :engineer_skills do |t|
      t.references :engineer, null: false, foreign_key: true
      t.references :skill, null: false, foreign_key: true
      t.string :level

      t.timestamps
    end
  end
end
