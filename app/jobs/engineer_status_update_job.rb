class EngineerStatusUpdateJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "Starting EngineerStatusUpdateJob at #{Time.current}"

    updated_count = 0
    error_count = 0
    status_changes = []

    Engineer.find_each do |engineer|
      begin
        old_status = engineer.status

        # Calculate the new status based on current dates
        new_status = engineer.calculate_status_from_dates_current

        if new_status && new_status != old_status
          # Update status directly to avoid callbacks loop
          engineer.update_column(:status, new_status)
          engineer.update_column(:updated_at, Time.current)

          status_changes << {
            id: engineer.id,
            name: engineer.name,
            old_status: old_status,
            new_status: new_status,
            reason: determine_status_change_reason(engineer)
          }

          updated_count += 1
          Rails.logger.info "Updated engineer #{engineer.name} (ID: #{engineer.id}): #{old_status} → #{new_status}"

          # Create individual notification for significant status changes
          create_engineer_notification(engineer, old_status, new_status) if significant_status_change?(old_status, new_status)
        end

      rescue => e
        error_count += 1
        Rails.logger.error "Error updating engineer #{engineer.name} (ID: #{engineer.id}): #{e.message}"
      end
    end

    Rails.logger.info "EngineerStatusUpdateJob completed: #{updated_count} engineers updated, #{error_count} errors"

    # Create summary notification if there were changes
    if status_changes.any?
      create_summary_notification(updated_count, status_changes)
    end

    Rails.logger.info "Completed EngineerStatusUpdateJob at #{Time.current}"
  end

  private

  def determine_status_change_reason(engineer)
    today = Date.current

    if engineer.current_client.present?
      if engineer.notice_date.present? && engineer.notice_date <= today + 30.days
        "Notice date within 30 days"
      elsif engineer.expected_end_date.present? && engineer.expected_end_date <= today + 30.days
        "Project ending within 30 days"
      else
        "On active project"
      end
    else
      if engineer.return_date.present? && engineer.return_date > today
        "On break until return date"
      else
        "Available for new projects"
      end
    end
  end

  def significant_status_change?(old_status, new_status)
    # Consider status changes significant if:
    # - Engineer becomes available (can be assigned to projects)
    # - Engineer starts rolling off soon (might need replacement)
    significant_transitions = [
      ["on_project", "rolling_off_soon"],
      ["on_project", "available"],
      ["rolling_off_soon", "available"]
    ]

    significant_transitions.include?([old_status, new_status])
  end

  def create_engineer_notification(engineer, old_status, new_status)
    return unless defined?(Notification)

    begin
      title = case new_status
              when "available"
                "Engineer Now Available"
              when "rolling_off_soon"
                "Engineer Rolling Off Soon"
              else
                "Engineer Status Updated"
              end

      message = "#{engineer.name} status changed from #{old_status.humanize} to #{new_status.humanize}."

      if new_status == "available"
        message += " They are now available for new project assignments."
      elsif new_status == "rolling_off_soon"
        days = engineer.days_until_notice || "Unknown"
        message += " They will be rolling off in #{days} days."
      end

      Notification.create!(
        title: title,
        message: message,
        notification_type: "availability_change",
        priority: new_status == "available" ? "medium" : "low",
        status: "unread",
        engineer: engineer
      )
    rescue => e
      Rails.logger.error "Failed to create engineer notification for #{engineer.name}: #{e.message}"
    end
  end

  def create_summary_notification(count, changes)
    return unless defined?(Notification)

    begin
      message = "Daily status update completed at #{Time.current.strftime('%Y-%m-%d %H:%M')}.\n"
      message += "#{count} engineer(s) had status changes:\n\n"

      changes.first(10).each do |change|
        message += "• #{change[:name]}: #{change[:old_status].humanize} → #{change[:new_status].humanize}\n"
      end

      if changes.length > 10
        message += "• ... and #{changes.length - 10} more changes\n"
      end

      message += "\nRun the engineers status report for more details."

      Notification.create!(
        title: "Daily Engineer Status Update",
        message: message,
        notification_type: "system",
        priority: "low",
        status: "unread"
      )
    rescue => e
      Rails.logger.error "Failed to create summary notification: #{e.message}"
    end
  end
end