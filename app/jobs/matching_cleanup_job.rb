class MatchingCleanupJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info "Starting MatchingCleanupJob at #{Time.current}"

    # Archive old rejected matches (older than 30 days)
    old_rejected_matches = Match.where(status: "rejected")
                                .where("updated_at < ?", 30.days.ago)

    archived_count = old_rejected_matches.update_all(status: "archived")
    Rails.logger.info "Archived #{archived_count} old rejected matches"

    # Clean up duplicate matches (keep the most recent one)
    duplicate_groups = Match.joins(:engineer, :client)
                           .group("engineers.id, clients.id")
                           .having("COUNT(*) > 1")
                           .pluck("engineers.id, clients.id, array_agg(matches.id ORDER BY matches.created_at DESC)")

    deleted_count = 0
    duplicate_groups.each do |engineer_id, client_id, match_ids|
      # Keep the first (most recent) match, delete the rest
      matches_to_delete = match_ids[1..-1] || []
      Match.where(id: matches_to_delete).destroy_all
      deleted_count += matches_to_delete.count
    end

    Rails.logger.info "Cleaned up #{deleted_count} duplicate matches"
    Rails.logger.info "Completed MatchingCleanupJob at #{Time.current}"
  end
end
