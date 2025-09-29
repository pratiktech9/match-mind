class AutomatedMatchingJob < ApplicationJob
  queue_as :default

  def perform(automation_config = {})
    Rails.logger.info "Starting AutomatedMatchingJob at #{Time.current}"

    # Initialize MCP Server
    @mcp_server = McpServer.new

    config = automation_config.with_defaults({
      "min_score" => 75,
      "max_matches_per_opportunity" => 5,
      "auto_create_high_score" => true,
      "high_score_threshold" => 85,
      "send_notifications" => true
    })

    begin
      # Step 1: Get automation status before starting
      status = get_automation_status
      Rails.logger.info "Pre-automation status: #{status.inspect}"

      # Step 2: Auto-create high-score matches using MCP Server
      matches_created = 0
      if config["auto_create_high_score"]
        matches_created = auto_create_matches_via_mcp(config)
      end

      # Step 3: Generate insights using MCP Server
      insights_generated = 0
      if config["send_notifications"]
        insights_generated = generate_insights_via_mcp
      end

      # Step 4: Trigger additional matching if needed
      opportunities_processed = trigger_matching_via_mcp

      # Step 5: Get final automation status
      final_status = get_automation_status

      # Step 6: Log comprehensive automation results
      log_automation_results(opportunities_processed, matches_created, insights_generated, final_status)

      Rails.logger.info "Completed AutomatedMatchingJob successfully"

    rescue => e
      Rails.logger.error "AutomatedMatchingJob failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise e
    end
  end

  private

  def get_automation_status
    request = {
      "method" => "tools/call",
      "params" => {
        "name" => "get_automation_status",
        "arguments" => {}
      }
    }

    response = @mcp_server.handle_request(request)
    response[:automation] if response && !response[:error]
  rescue => e
    Rails.logger.error "Failed to get automation status: #{e.message}"
    nil
  end

  def auto_create_matches_via_mcp(config)
    request = {
      "method" => "tools/call",
      "params" => {
        "name" => "auto_create_high_score_matches",
        "arguments" => {
          "min_score" => config["high_score_threshold"],
          "max_matches" => config["max_matches_per_opportunity"] * 10 # Allow more matches across all opportunities
        }
      }
    }

    response = @mcp_server.handle_request(request)

    if response && !response[:error]
      created_matches = response[:created_matches] || []
      Rails.logger.info "MCP Server created #{created_matches.count} high-score matches"

      # Create notifications for each match created
      created_matches.each do |match_info|
        create_match_notification(match_info)
      end

      created_matches.count
    else
      Rails.logger.error "Failed to auto-create matches via MCP: #{response[:error] if response}"
      0
    end
  rescue => e
    Rails.logger.error "Error in auto_create_matches_via_mcp: #{e.message}"
    0
  end

  def generate_insights_via_mcp
    request = {
      "method" => "tools/call",
      "params" => {
        "name" => "get_match_insights",
        "arguments" => {
          "days" => 1 # Get insights for last 24 hours
        }
      }
    }

    response = @mcp_server.handle_request(request)

    if response && !response[:error]
      insights = response[:insights]
      Rails.logger.info "Generated MCP insights: #{insights.inspect}"

      # Create summary notification based on insights
      create_insights_notification(insights)

      1
    else
      Rails.logger.error "Failed to generate insights via MCP: #{response[:error] if response}"
      0
    end
  rescue => e
    Rails.logger.error "Error in generate_insights_via_mcp: #{e.message}"
    0
  end

  def trigger_matching_via_mcp
    request = {
      "method" => "tools/call",
      "params" => {
        "name" => "trigger_matching",
        "arguments" => {} # Trigger for all opportunities
      }
    }

    response = @mcp_server.handle_request(request)

    if response && !response[:error]
      Rails.logger.info "Triggered matching via MCP: #{response[:job_id]}"

      # Count active opportunities as a proxy for opportunities processed
      ClientOpportunity.active.count
    else
      Rails.logger.error "Failed to trigger matching via MCP: #{response[:error] if response}"
      0
    end
  rescue => e
    Rails.logger.error "Error in trigger_matching_via_mcp: #{e.message}"
    0
  end

  def create_match_notification(match_info)
    Notification.create!(
      title: "Auto-Match Created (MCP)",
      message: "High-score match automatically created: #{match_info[:engineer_name]} → #{match_info[:opportunity_title]} (#{match_info[:score]}% match)",
      notification_type: "high_score_match",
      priority: "high",
      status: "unread"
    )
  rescue => e
    Rails.logger.error "Failed to create match notification: #{e.message}"
  end

  def create_insights_notification(insights)
    summary = insights[:summary] || {}

    message = "Automation Report: #{summary[:total_matches] || 0} matches processed, " \
              "#{summary[:average_score] || 0}% avg score, " \
              "#{summary[:high_score_matches] || 0} high-quality matches found."

    # Add recommendations if available
    if insights[:recommendations]&.any?
      message += " Recommendations: #{insights[:recommendations].map { |r| r[:message] }.join('; ')}"
    end

    Notification.create!(
      title: "MCP Automation Summary",
      message: message,
      notification_type: "potential_match",
      priority: "medium",
      status: "unread"
    )
  rescue => e
    Rails.logger.error "Failed to create insights notification: #{e.message}"
  end

  def log_automation_results(opportunities, matches, insights, final_status)
    Rails.logger.info "=== MCP-Powered Automation Results ==="
    Rails.logger.info "- Opportunities processed: #{opportunities}"
    Rails.logger.info "- High-score matches created: #{matches}"
    Rails.logger.info "- Insights generated: #{insights}"

    if final_status
      sidekiq_status = final_status[:sidekiq_status] || {}
      Rails.logger.info "- Sidekiq processed: #{sidekiq_status[:processed] || 0}"
      Rails.logger.info "- Sidekiq enqueued: #{sidekiq_status[:enqueued] || 0}"
      Rails.logger.info "- Sidekiq failed: #{sidekiq_status[:failed] || 0}"

      scheduled_jobs = final_status[:scheduled_jobs] || {}
      Rails.logger.info "- Scheduled automation jobs: #{scheduled_jobs[:automated_matching]&.count || 0}"
      Rails.logger.info "- Scheduled cleanup jobs: #{scheduled_jobs[:weekly_cleanup]&.count || 0}"
    end

    Rails.logger.info "=== End MCP Automation Results ==="
  end
end
