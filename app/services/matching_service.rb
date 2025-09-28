class MatchingService
  API_URL = "https://openrouter.ai/api/v1/chat/completions"

  def self.find_matches_for_opportunity(opportunity)
    engineers = Engineer.includes(:skills, :engineer_skills).where(status: "available")
    matches = []

    engineers.each do |engineer|
      match_score = calculate_match_score(engineer, opportunity)
      explanation = generate_explanation(engineer, opportunity, match_score)

      matches << {
        engineer: engineer,
        opportunity: opportunity,
        score: match_score,
        explanation: explanation
      }
    end

    # Sort by score (highest first)
    matches.sort_by { |match| -match[:score] }
  end

  def self.find_matches_for_engineer(engineer)
    opportunities = ClientOpportunity.includes(:skills, :client_opportunity_skills).where(status: "active")
    matches = []

    opportunities.each do |opportunity|
      match_score = calculate_match_score(engineer, opportunity)
      explanation = generate_explanation(engineer, opportunity, match_score)

      matches << {
        engineer: engineer,
        opportunity: opportunity,
        score: match_score,
        explanation: explanation
      }
    end

    # Sort by score (highest first)
    matches.sort_by { |match| -match[:score] }
  end

  def self.calculate_match_score(engineer, opportunity)
    # For now, use basic scoring until we can test the AI integration
    basic_score(engineer, opportunity)
  end

  def self.generate_explanation(engineer, opportunity, score)
    # For now, use basic explanation until we can test the AI integration
    "Basic match explanation: Engineer #{engineer.name} has relevant skills for #{opportunity.title} at #{opportunity.client.name}. Score: #{score}/100"
  end

  private

  # Fallback scoring if AI is unavailable
  def self.basic_score(engineer, opportunity)
    score = 0

    # Skill matching (40 points)
    engineer_skill_names = engineer.skills.pluck(:name)
    opportunity_skill_names = opportunity.skills.pluck(:name)
    required_skill_names = opportunity.required_skills.pluck(:name)

    skill_match_ratio = opportunity_skill_names.size > 0 ? (engineer_skill_names & opportunity_skill_names).size.to_f / opportunity_skill_names.size : 0
    required_skill_match_ratio = required_skill_names.size > 0 ? (engineer_skill_names & required_skill_names).size.to_f / required_skill_names.size : 0

    score += (skill_match_ratio * 20).to_i
    score += (required_skill_match_ratio * 20).to_i

    # Budget compatibility (20 points)
    if opportunity.budget && engineer.target_rate
      budget_hourly = opportunity.budget / 2000 # Assume 2000 hours/year
      if budget_hourly >= engineer.target_rate
        score += 20
      elsif budget_hourly >= engineer.target_rate * 0.8
        score += 15
      elsif budget_hourly >= engineer.target_rate * 0.6
        score += 10
      end
    end

    # Geographic compatibility (20 points)
    if opportunity.geo.downcase.include?("remote") ||
       engineer.country.downcase.include?(opportunity.geo.downcase)
      score += 20
    end

    # Status compatibility (20 points)
    if engineer.status == "available" || engineer.status == "available_soon"
      score += 20
    elsif engineer.status == "busy"
      score += 5
    end

    [ score, 100 ].min
  end
end
