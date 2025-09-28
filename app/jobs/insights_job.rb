class InsightsJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "Starting InsightsJob at #{Time.current}"

    begin
      insights_generated = InsightsService.generate_all_insights

      Rails.logger.info "InsightsJob completed successfully. Generated #{insights_generated} insights at #{Time.current}"

      # Schedule next run (daily)
      InsightsJob.set(wait: 24.hours).perform_later

    rescue StandardError => e
      Rails.logger.error "InsightsJob failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")

      # Retry with exponential backoff
      retry_job(wait: 1.hour)
    end
  end
end
