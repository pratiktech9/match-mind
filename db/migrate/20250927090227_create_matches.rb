class CreateMatches < ActiveRecord::Migration[8.0]
  def change
    create_table :matches do |t|
      t.references :engineer, null: false, foreign_key: true
      t.references :client, null: false, foreign_key: true
      t.decimal :score
      t.text :explanation

      t.timestamps
    end
  end
end
