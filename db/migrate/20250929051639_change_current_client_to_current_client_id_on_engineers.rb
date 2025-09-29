class ChangeCurrentClientToCurrentClientIdOnEngineers < ActiveRecord::Migration[8.0]
  def up
    # Add the new current_client_id column
    add_reference :engineers, :current_client, null: true, foreign_key: { to_table: :clients }

    # Migrate existing data - match client names to client IDs
    Engineer.reset_column_information

    Engineer.find_each do |engineer|
      if engineer.current_client.present?
        client = Client.find_by(name: engineer.current_client)
        if client
          engineer.update_column(:current_client_id, client.id)
        else
          # Create client if it doesn't exist (for data integrity)
          client = Client.create!(name: engineer.current_client, industry: "Unknown")
          engineer.update_column(:current_client_id, client.id)
        end
      end
    end

    # Remove the old current_client string column
    remove_column :engineers, :current_client, :string
  end

  def down
    # Add back the string column
    add_column :engineers, :current_client, :string

    # Migrate data back
    Engineer.reset_column_information

    Engineer.includes(:current_client).find_each do |engineer|
      if engineer.current_client_id.present? && engineer.current_client
        engineer.update_column(:current_client, engineer.current_client.name)
      end
    end

    # Remove the foreign key column
    remove_reference :engineers, :current_client, foreign_key: true
  end
end
