namespace :engineers do
  desc "Update all engineer statuses based on current dates"
  task update_statuses: :environment do
    puts "Starting engineer status update at #{Time.current}"

    updated_count = 0
    error_count = 0
    status_changes = []

    Engineer.find_each do |engineer|
      begin
        old_status = engineer.status

        # Force recalculation by touching the record without callbacks
        # This will trigger the before_save callback to recalculate status
        engineer.updated_at = Time.current

        # Calculate the new status
        new_status = engineer.calculate_status_from_dates_current

        if new_status && new_status != old_status
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
          puts "✅ Updated #{engineer.name} (ID: #{engineer.id}): #{old_status} → #{new_status}"
        else
          puts "ℹ️  No change for #{engineer.name} (ID: #{engineer.id}): #{old_status || 'nil'}"
        end

      rescue => e
        error_count += 1
        puts "❌ Error updating #{engineer.name} (ID: #{engineer.id}): #{e.message}"
        Rails.logger.error "Engineer status update error for ID #{engineer.id}: #{e.message}"
      end
    end

    puts "\n📊 Engineer Status Update Summary:"
    puts "- Total engineers processed: #{Engineer.count}"
    puts "- Statuses updated: #{updated_count}"
    puts "- Errors: #{error_count}"
    puts "- Completed at: #{Time.current}"

    if status_changes.any?
      puts "\n📋 Status Changes Details:"
      status_changes.each do |change|
        puts "  • #{change[:name]}: #{change[:old_status]} → #{change[:new_status]} (#{change[:reason]})"
      end

      # Create a summary notification for admins
      create_status_update_notification(updated_count, status_changes)
    else
      puts "\n✅ No status changes required - all engineers are up to date!"
    end
  end

  desc "Show current status distribution of engineers"
  task status_report: :environment do
    puts "📊 Engineer Status Report (as of #{Time.current})"
    puts "=" * 50

    total_engineers = Engineer.count
    puts "Total Engineers: #{total_engineers}"
    puts ""

    statuses = Engineer.group(:status).count
    statuses.each do |status, count|
      percentage = (count.to_f / total_engineers * 100).round(1)
      status_display = status&.humanize || "Unknown"
      puts "#{status_display.ljust(20)}: #{count.to_s.rjust(3)} (#{percentage}%)"
    end

    puts ""
    puts "📅 Engineers rolling off within 30 days:"
    rolling_off = Engineer.rolling_off_within_days(30)
    if rolling_off.any?
      rolling_off.each do |engineer|
        days = engineer.days_until_notice || engineer.days_until_return || "Unknown"
        puts "  • #{engineer.name} - #{days} days"
      end
    else
      puts "  None"
    end

    puts ""
    puts "🔄 Engineers returning within 30 days:"
    returning = Engineer.returning_within_days(30)
    if returning.any?
      returning.each do |engineer|
        days = engineer.days_until_return
        puts "  • #{engineer.name} - #{days} days"
      end
    else
      puts "  None"
    end
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

  def create_status_update_notification(count, changes)
    return unless defined?(Notification)

    begin
      message = "Daily status update completed: #{count} engineers updated.\n\n"
      message += "Changes:\n"
      changes.first(5).each do |change|
        message += "• #{change[:name]}: #{change[:old_status]} → #{change[:new_status]}\n"
      end

      if changes.length > 5
        message += "• ... and #{changes.length - 5} more changes\n"
      end

      Notification.create!(
        title: "Engineer Status Update Complete",
        message: message,
        notification_type: "system",
        priority: "low",
        status: "unread"
      )
    rescue => e
      Rails.logger.error "Failed to create status update notification: #{e.message}"
    end
  end
end