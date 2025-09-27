class UpdateClientsTable < ActiveRecord::Migration[8.0]
  def change
    # Remove fields that are now in client_opportunities
    remove_column :clients, :geo, :string
    remove_column :clients, :employment_type, :string
    remove_column :clients, :notes, :text

    # Keep only client-level fields
    # name, industry remain
  end
end
