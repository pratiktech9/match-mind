class InsightsService
  def self.generate_all_insights
    Rails.logger.info "Starting insights generation at #{Time.current}"
    
    # Clear old unread notifications to avoid duplicates
    Notification.unread.where('created_at < ?', 1.day.ago).update_all(status: 'archived')
    
    insights_generated = 0
    
    # 1. Check for engineers rolling off soon
    insights_generated += check_rolling_off_engineers
    
    # 2. Check for potential high-score matches
    insights_generated += check_potential_matches
    
    # 3. Check for new opportunities without matches
    insights_generated += check_new_opportunities
    
    # 4. Check for skill gaps
    insights_generated += check_skill_gaps
    
    # 5. Check for budget mismatches
    insights_generated += check_budget_mismatches
    
    Rails.logger.info "Generated #{insights_generated} insights at #{Time.current}"
    insights_generated
  end

  def self.check_rolling_off_engineers
    insights_count = 0
    
    # Find engineers who are rolling off soon
    engineers_rolling_off = Engineer.where(status: ['available_soon', 'rolling_off_soon'])
                                   .where('notice_date IS NOT NULL AND notice_date <= ?', 30.days.from_now)
    
    engineers_rolling_off.each do |engineer|
      # Check if we already have a recent notification for this engineer
      existing_notification = Notification.where(engineer: engineer, notification_type: 'rolling_off_soon')
                                         .where('created_at > ?', 1.day.ago)
                                         .first
      
      unless existing_notification
        Notification.create_rolling_off_notification(engineer)
        insights_count += 1
      end
    end
    
    insights_count
  end

  def self.check_potential_matches
    insights_count = 0
    
    # Find active opportunities
    active_opportunities = ClientOpportunity.active.includes(:client, :skills)
    
    active_opportunities.each do |opportunity|
      # Find available engineers
      available_engineers = Engineer.available.includes(:skills)
      
      available_engineers.each do |engineer|
        # Calculate match score
        score = MatchingService.calculate_match_score(engineer, opportunity)
        
        # Only create notifications for high-score matches
        if score >= 80
          # Check if we already have a recent notification for this match
          existing_notification = Notification.where(
            engineer: engineer, 
            client_opportunity: opportunity, 
            notification_type: 'potential_match'
          ).where('created_at > ?', 3.days.ago).first
          
          unless existing_notification
            Notification.create_potential_match_notification(engineer, opportunity, score)
            insights_count += 1
          end
        end
      end
    end
    
    insights_count
  end

  def self.check_new_opportunities
    insights_count = 0
    
    # Find opportunities created in the last 7 days that don't have matches
    new_opportunities = ClientOpportunity.active
                                        .where('created_at > ?', 7.days.ago)
                                        .includes(:matches)
    
    new_opportunities.each do |opportunity|
      # Check if opportunity has any matches
      if opportunity.matches.empty?
        # Check if we already have a notification for this opportunity
        existing_notification = Notification.where(
          client_opportunity: opportunity, 
          notification_type: 'new_opportunity'
        ).where('created_at > ?', 1.day.ago).first
        
        unless existing_notification
          Notification.create_new_opportunity_notification(opportunity)
          insights_count += 1
        end
      end
    end
    
    insights_count
  end

  def self.check_skill_gaps
    insights_count = 0
    
    # Find active opportunities with required skills
    opportunities_with_skills = ClientOpportunity.active
                                                .joins(:skills)
                                                .where(client_opportunity_skills: { required: true })
                                                .distinct
    
    opportunities_with_skills.each do |opportunity|
      # Check if we already have a recent skill gap notification
      existing_notification = Notification.where(
        client_opportunity: opportunity, 
        notification_type: 'skill_gap'
      ).where('created_at > ?', 7.days.ago).first
      
      unless existing_notification
        Notification.create_skill_gap_notification(opportunity)
        insights_count += 1
      end
    end
    
    insights_count
  end

  def self.check_budget_mismatches
    insights_count = 0
    
    # Find opportunities with budget and engineers with target rates
    opportunities_with_budget = ClientOpportunity.active
                                                .where('budget IS NOT NULL AND budget > 0')
    
    engineers_with_rates = Engineer.available
                                  .where('target_rate IS NOT NULL AND target_rate > 0')
    
    opportunities_with_budget.each do |opportunity|
      engineers_with_rates.each do |engineer|
        budget_hourly = opportunity.budget / 2000
        
        # Check for significant budget mismatch
        if budget_hourly < engineer.target_rate * 0.8
          # Check if we already have a recent budget mismatch notification
          existing_notification = Notification.where(
            engineer: engineer,
            client_opportunity: opportunity,
            notification_type: 'budget_mismatch'
          ).where('created_at > ?', 7.days.ago).first
          
          unless existing_notification
            Notification.create_budget_mismatch_notification(engineer, opportunity)
            insights_count += 1
          end
        end
      end
    end
    
    insights_count
  end

  def self.generate_engineer_insights(engineer)
    insights = []
    
    # Check if engineer is rolling off soon
    if engineer.status == 'available_soon' && engineer.notice_date
      days_until_rolloff = engineer.days_until_notice
      if days_until_rolloff && days_until_rolloff <= 30
        insights << {
          type: 'rolling_off_soon',
          priority: days_until_rolloff <= 7 ? 'urgent' : 'high',
          message: "Rolling off in #{days_until_rolloff} days"
        }
      end
    end
    
    # Check for high-score matches
    active_opportunities = ClientOpportunity.active.includes(:client, :skills)
    high_score_matches = []
    
    active_opportunities.each do |opportunity|
      score = MatchingService.calculate_match_score(engineer, opportunity)
      if score >= 80
        high_score_matches << {
          opportunity: opportunity,
          score: score
        }
      end
    end
    
    if high_score_matches.any?
      insights << {
        type: 'high_score_matches',
        priority: 'medium',
        message: "#{high_score_matches.count} high-score matches found",
        matches: high_score_matches
      }
    end
    
    insights
  end

  def self.generate_opportunity_insights(opportunity)
    insights = []
    
    # Check for skill gaps
    required_skills = opportunity.required_skills.pluck(:name)
    available_engineers = Engineer.available.includes(:skills)
    
    engineers_with_skills = available_engineers.select do |engineer|
      engineer_skills = engineer.skills.pluck(:name)
      (required_skills & engineer_skills).any?
    end
    
    if engineers_with_skills.empty?
      insights << {
        type: 'skill_gap',
        priority: 'high',
        message: "No available engineers have required skills"
      }
    end
    
    # Check for budget mismatches
    if opportunity.budget
      budget_hourly = opportunity.budget / 2000
      engineers_with_rates = Engineer.available
                                    .where('target_rate IS NOT NULL AND target_rate > 0')
      
      compatible_engineers = engineers_with_rates.select do |engineer|
        budget_hourly >= engineer.target_rate * 0.8
      end
      
      if compatible_engineers.empty?
        insights << {
          type: 'budget_mismatch',
          priority: 'medium',
          message: "Budget may be too low for available engineers"
        }
      end
    end
    
    insights
  end
end
