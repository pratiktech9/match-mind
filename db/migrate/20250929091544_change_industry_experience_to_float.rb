class ChangeIndustryExperienceToFloat < ActiveRecord::Migration[8.0]
  def up
    # Add a temporary column
    add_column :engineers, :industry_experience_temp, :float, default: 0.0

    # Convert existing data
    Engineer.find_each do |engineer|
      if engineer.industry_experience.present?
        # Try to parse as a number, set to 0.0 if not parseable
        converted_value = Float(engineer.industry_experience) rescue 0.0
      else
        converted_value = 0.0
      end
      engineer.update_column(:industry_experience_temp, converted_value)
    end

    # Remove the old column and rename the new one
    remove_column :engineers, :industry_experience
    rename_column :engineers, :industry_experience_temp, :industry_experience
  end

  def down
    # Add temporary string column
    add_column :engineers, :industry_experience_temp, :string

    # Convert float values back to string
    Engineer.find_each do |engineer|
      string_value = engineer.industry_experience&.to_s || ""
      engineer.update_column(:industry_experience_temp, string_value)
    end

    # Remove the float column and rename the string one
    remove_column :engineers, :industry_experience
    rename_column :engineers, :industry_experience_temp, :industry_experience
  end
end
