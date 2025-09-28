require "httparty"

class MatchingService
  include HTTParty
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
    # Try AI-powered scoring first, fallback to basic scoring
    ai_score(engineer, opportunity)
  rescue => e
    Rails.logger.error "AI scoring failed: #{e.message}. Falling back to basic scoring."
    basic_score(engineer, opportunity)
  end

  def self.generate_explanation(engineer, opportunity, score)
    # Try AI-powered explanation first, fallback to basic explanation
    ai_explanation(engineer, opportunity, score)
  rescue => e
    Rails.logger.error "AI explanation failed: #{e.message}. Falling back to basic explanation."
    "Basic match explanation: Engineer #{engineer.name} has relevant skills for #{opportunity.title} at #{opportunity.client.name}. Score: #{score}/100"
  end

  private

  # AI-powered scoring using OpenRouter
  def self.ai_score(engineer, opportunity)
    prompt = build_matching_prompt(engineer, opportunity)

    response = HTTParty.post(API_URL, {
      headers: {
        "Authorization" => "Bearer #{ENV['OPENROUTER_API_KEY']}",
        "Content-Type" => "application/json",
        "HTTP-Referer" => "http://localhost:3000",
        "X-Title" => "Match Mind AI Matching"
      },
      body: {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: 'You are an expert technical recruiter. Analyze the match between an engineer and a job opportunity. Return ONLY a JSON object with "score" (0-100) and "explanation" (string).'
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }.to_json
    })

    if response.success?
      result = JSON.parse(response.body)
      content = result["choices"][0]["message"]["content"]
      match_data = JSON.parse(content)
      match_data["score"].to_f
    else
      raise "OpenRouter API error: #{response.code} - #{response.body}"
    end
  end

  # AI-powered explanation using OpenRouter
  def self.ai_explanation(engineer, opportunity, score)
    prompt = build_explanation_prompt(engineer, opportunity, score)

    response = HTTParty.post(API_URL, {
      headers: {
        "Authorization" => "Bearer #{ENV['OPENROUTER_API_KEY']}",
        "Content-Type" => "application/json",
        "HTTP-Referer" => "http://localhost:3000",
        "X-Title" => "Match Mind AI Matching"
      },
      body: {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert technical recruiter. Provide a detailed explanation for why this engineer matches this opportunity. Be specific about skills, experience, and fit."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 300
      }.to_json
    })

    if response.success?
      result = JSON.parse(response.body)
      result["choices"][0]["message"]["content"]
    else
      raise "OpenRouter API error: #{response.code} - #{response.body}"
    end
  end

  # Build prompt for matching analysis
  def self.build_matching_prompt(engineer, opportunity)
    engineer_skills = engineer.skills.pluck(:name).join(", ")
    opportunity_skills = opportunity.skills.pluck(:name).join(", ")
    required_skills = opportunity.required_skills.pluck(:name).join(", ")

    <<~PROMPT
      Analyze the match between this engineer and job opportunity:

      ENGINEER:
      - Name: #{engineer.name}
      - Country: #{engineer.country}
      - Status: #{engineer.status}
      - Industry Experience: #{engineer.industry_experience}
      - Target Rate: $#{engineer.target_rate}/hour
      - Skills: #{engineer_skills}

      OPPORTUNITY:
      - Title: #{opportunity.title}
      - Company: #{opportunity.client.name}
      - Location: #{opportunity.geo}
      - Employment Type: #{opportunity.employment_type}
      - Budget: $#{opportunity.budget}
      - All Skills: #{opportunity_skills}
      - Required Skills: #{required_skills}

      Rate the match from 0-100 considering:
      1. Skill alignment (40% weight)
      2. Budget compatibility (20% weight)
      3. Geographic fit (20% weight)
      4. Availability and timing (20% weight)

      Return JSON: {"score": 85, "explanation": "Detailed explanation here"}
    PROMPT
  end

  # Build prompt for explanation
  def self.build_explanation_prompt(engineer, opportunity, score)
    engineer_skills = engineer.skills.pluck(:name).join(", ")
    opportunity_skills = opportunity.skills.pluck(:name).join(", ")

    <<~PROMPT
      Explain why #{engineer.name} is a #{score}% match for #{opportunity.title} at #{opportunity.client.name}:

      Engineer Skills: #{engineer_skills}
      Opportunity Skills: #{opportunity_skills}
      Location: #{opportunity.geo}
      Budget: $#{opportunity.budget}
      Target Rate: $#{engineer.target_rate}/hour

      Provide a detailed explanation focusing on:
      - Skill overlap and gaps
      - Budget compatibility
      - Geographic considerations
      - Overall fit assessment
    PROMPT
  end

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
