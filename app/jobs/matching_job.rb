class MatchingJob < ApplicationJob
  queue_as :default

  def perform(opportunity_id = nil)
    Rails.logger.info "Starting MatchingJob at #{Time.current}"

    opportunities = if opportunity_id.present?
                     # Process specific opportunity
                     ClientOpportunity.where(id: opportunity_id)
    else
                     # Process all active opportunities
                     ClientOpportunity.active
    end

    opportunities.find_each do |opportunity|
      process_opportunity_matches(opportunity)
    end

    Rails.logger.info "Completed MatchingJob at #{Time.current}"
  end

  private

  def process_opportunity_matches(opportunity)
    Rails.logger.info "Processing matches for opportunity: #{opportunity.title}"

    begin
      # Use the existing MatchingService to find matches
      matches = MatchingService.find_matches_for_opportunity(opportunity)

      # Store or update match records
      matches.each do |match_data|
        engineer = match_data[:engineer]
        score = match_data[:score]
        explanation = match_data[:explanation]

        # Find or create match record
        match = Match.find_or_initialize_by(
          engineer: engineer,
          client: opportunity.client,
          client_opportunity: opportunity
        )

        # Update match data
        match.assign_attributes(
          score: score,
          explanation: explanation,
          status: "pending",
          matched_at: Time.current
        )

        if match.save
          Rails.logger.info "Saved match: #{engineer.name} -> #{opportunity.title} (Score: #{score})"
        end
      end

      Rails.logger.info "Processed #{matches.count} matches for #{opportunity.title}"

    rescue StandardError => e
      Rails.logger.error "Error processing matches for opportunity #{opportunity.id}: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
    end
  end
end
