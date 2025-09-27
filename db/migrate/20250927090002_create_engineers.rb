class CreateEngineers < ActiveRecord::Migration[8.0]
  def change
    create_table :engineers do |t|
      t.string :name
      t.string :email
      t.string :country
      t.string :status
      t.string :current_client
      t.string :industry_experience
      t.date :notice_date
      t.date :expected_end_date
      t.date :return_date
      t.text :notes
      t.integer :utilization
      t.decimal :target_rate

      t.timestamps
    end
    add_index :engineers, :email
  end
end
