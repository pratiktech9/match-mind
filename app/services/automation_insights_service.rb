class AutomationInsightsService
  def self.generate_match_insights(days = 7)
    start_date = days.days.ago

    # Get matches from the specified period
    recent_matches = Match.includes(:engineer, :client_opportunity, :client)
                         .where('created_at > ?', start_date)

    # Calculate insights
    insights = {
      summary: generate_summary(recent_matches, days),
      trends: analyze_trends(recent_matches, days),
      recommendations: generate_recommendations(recent_matches),
      top_skills: analyze_top_skills(recent_matches),
      match_quality: analyze_match_quality(recent_matches)
    }

    insights
  end

  private

  def self.generate_summary(matches, days)
    total_matches = matches.count
    avg_score = matches.average(:score)&.round(1) || 0
    high_score_matches = matches.where('score >= 85').count

    {
      total_matches: total_matches,
      average_score: avg_score,
      high_score_matches: high_score_matches,
      match_rate_per_day: (total_matches.to_f / days).round(1),
      quality_percentage: total_matches > 0 ? ((high_score_matches.to_f / total_matches) * 100).round(1) : 0
    }
  end

  def self.analyze_trends(matches, days)
    # Group matches by day
    matches_by_day = matches.group_by { |match| match.created_at.to_date }

    # Calculate daily match counts
    daily_counts = (days - 1).downto(0).map do |days_ago|
      date = Date.current - days_ago.days
      matches_by_day[date]&.count || 0
    end

    # Calculate trend
    recent_avg = daily_counts.last(3).sum / 3.0
    earlier_avg = daily_counts.first(3).sum / 3.0
    trend = recent_avg > earlier_avg ? 'increasing' : (recent_avg < earlier_avg ? 'decreasing' : 'stable')

    {
      daily_counts: daily_counts,
      trend: trend,
      trend_percentage: earlier_avg > 0 ? (((recent_avg - earlier_avg) / earlier_avg) * 100).round(1) : 0
    }
  end

  def self.generate_recommendations(matches)
    recommendations = []

    # Analyze match scores
    low_score_matches = matches.where('score < 70').count
    total_matches = matches.count

    if total_matches > 0 && (low_score_matches.to_f / total_matches) > 0.3
      recommendations << {
        type: 'quality_improvement',
        priority: 'high',
        message: 'High percentage of low-score matches. Consider refining skill requirements or expanding talent pool.'
      }
    end

    # Analyze unmatched opportunities
    unmatched_opportunities = ClientOpportunity.active
                                              .left_joins(:matches)
                                              .where(matches: { id: nil })
                                              .count

    if unmatched_opportunities > 5
      recommendations << {
        type: 'coverage',
        priority: 'medium',
        message: "#{unmatched_opportunities} opportunities have no matches. Consider running additional matching cycles."
      }
    end

    # Analyze skill gaps
    top_opportunity_skills = ClientOpportunity.active
                                             .joins(:skills)
                                             .group('skills.name')
                                             .count
                                             .sort_by { |_, count| -count }
                                             .first(5)
                                             .to_h

    available_engineer_skills = Engineer.available
                                       .joins(:skills)
                                       .group('skills.name')
                                       .count

    skill_gaps = top_opportunity_skills.select do |skill, opp_count|
      engineer_count = available_engineer_skills[skill] || 0
      opp_count > engineer_count * 2 # More than 2x demand vs supply
    end

    if skill_gaps.any?
      recommendations << {
        type: 'skill_gap',
        priority: 'high',
        message: "Skill gaps detected in: #{skill_gaps.keys.join(', ')}. Consider training or hiring."
      }
    end

    recommendations
  end

  def self.analyze_top_skills(matches)
    # Get skills from matched engineers
    skill_counts = matches.joins(engineer: :skills)
                         .group('skills.name')
                         .count
                         .sort_by { |_, count| -count }
                         .first(10)

    skill_counts.map do |skill_name, count|
      {
        name: skill_name,
        match_count: count,
        avg_score: matches.joins(engineer: :skills)
                         .where(skills: { name: skill_name })
                         .average(:score)
                         &.round(1) || 0
      }
    end
  end

  def self.analyze_match_quality(matches)
    return { ranges: [], distribution: [] } if matches.empty?

    score_ranges = [
      { range: '90-100', min: 90, max: 100 },
      { range: '80-89', min: 80, max: 89 },
      { range: '70-79', min: 70, max: 79 },
      { range: '60-69', min: 60, max: 69 },
      { range: '0-59', min: 0, max: 59 }
    ]

    total_matches = matches.count

    distribution = score_ranges.map do |range_info|
      count = matches.where(score: range_info[:min]..range_info[:max]).count
      percentage = ((count.to_f / total_matches) * 100).round(1)

      {
        range: range_info[:range],
        count: count,
        percentage: percentage
      }
    end

    {
      total_matches: total_matches,
      average_score: matches.average(:score)&.round(1) || 0,
      median_score: calculate_median_score(matches),
      distribution: distribution
    }
  end

  def self.calculate_median_score(matches)
    scores = matches.pluck(:score).sort
    return 0 if scores.empty?

    mid = scores.length / 2
    if scores.length.odd?
      scores[mid]
    else
      (scores[mid - 1] + scores[mid]) / 2.0
    end.round(1)
  end
end
