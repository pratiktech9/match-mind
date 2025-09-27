class Match < ApplicationRecord
  # Associations
  belongs_to :engineer
  belongs_to :client

  # Validations
  validates :score, presence: true, numericality: { in: 0.0..100.0 }
  validates :engineer_id, uniqueness: { scope: :client_id }

  # Scopes
  scope :high_score, ->(min_score = 80) { where("score >= ?", min_score) }
  scope :by_engineer, ->(engineer) { where(engineer: engineer) }
  scope :by_client, ->(client) { where(client: client) }
  scope :recent, -> { order(created_at: :desc) }
  scope :top_matches, ->(limit = 10) { order(score: :desc).limit(limit) }

  # Class methods
  def self.best_matches_for_engineer(engineer, limit = 5)
    where(engineer: engineer).order(score: :desc).limit(limit)
  end

  def self.best_matches_for_client(client, limit = 5)
    where(client: client).order(score: :desc).limit(limit)
  end

  def self.create_match(engineer, client, score, explanation = nil)
    create!(
      engineer: engineer,
      client: client,
      score: score,
      explanation: explanation
    )
  end

  # Instance methods
  def engineer_name
    engineer.name
  end

  def client_name
    client.name
  end

  def score_percentage
    "#{score.round(1)}%"
  end

  def high_match?
    score >= 80
  end

  def medium_match?
    score >= 60 && score < 80
  end

  def low_match?
    score < 60
  end

  def match_quality
    case score
    when 80..100 then "Excellent"
    when 60..79 then "Good"
    when 40..59 then "Fair"
    else "Poor"
    end
  end

  def skill_overlap
    engineer_skills = engineer.skill_names
    client_skills = client.skill_names
    overlap = engineer_skills & client_skills
    {
      overlap: overlap,
      overlap_count: overlap.count,
      engineer_skills: engineer_skills,
      client_skills: client_skills,
      overlap_percentage: (overlap.count.to_f / [ engineer_skills.count, client_skills.count ].max * 100).round(1)
    }
  end

  def compatibility_factors
    factors = []

    # Skill compatibility
    skill_overlap = skill_overlap
    if skill_overlap[:overlap_percentage] >= 70
      factors << "High skill overlap (#{skill_overlap[:overlap_percentage]}%)"
    elsif skill_overlap[:overlap_percentage] >= 40
      factors << "Moderate skill overlap (#{skill_overlap[:overlap_percentage]}%)"
    else
      factors << "Low skill overlap (#{skill_overlap[:overlap_percentage]}%)"
    end

    # Geographic compatibility
    if engineer.country == client.geo
      factors << "Same geographic location"
    end

    # Industry experience
    if engineer.industry_experience == client.industry
      factors << "Relevant industry experience"
    end

    # Availability
    if engineer.available?
      factors << "Currently available"
    elsif engineer.rolling_off_soon?
      factors << "Rolling off soon"
    end

    factors
  end
end
