class AddFieldsToMatches < ActiveRecord::Migration[8.0]
  def change
    add_reference :matches, :client_opportunity, null: true, foreign_key: true
    add_column :matches, :status, :string, default: 'pending'
    add_column :matches, :matched_at, :datetime
  end
end
