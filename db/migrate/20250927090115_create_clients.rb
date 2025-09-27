class CreateClients < ActiveRecord::Migration[8.0]
  def change
    create_table :clients do |t|
      t.string :name
      t.string :geo
      t.string :industry
      t.string :employment_type
      t.text :notes

      t.timestamps
    end
  end
end
