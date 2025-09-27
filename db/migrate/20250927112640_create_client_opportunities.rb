class CreateClientOpportunities < ActiveRecord::Migration[8.0]
  def change
    create_table :client_opportunities do |t|
      t.references :client, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :geo, null: false
      t.string :employment_type, null: false
      t.string :job_role, null: false
      t.string :status, default: 'active'
      t.string :priority, default: 'medium'
      t.decimal :budget, precision: 10, scale: 2
      t.date :start_date
      t.date :end_date

      t.timestamps
    end

    add_index :client_opportunities, [ :client_id, :status ]
    add_index :client_opportunities, :geo
    add_index :client_opportunities, :employment_type
    add_index :client_opportunities, :job_role
  end
end
