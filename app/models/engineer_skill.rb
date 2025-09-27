class EngineerSkill < ApplicationRecord
  # Associations
  belongs_to :engineer
  belongs_to :skill

  # Validations
  validates :level, presence: true, inclusion: { in: %w[primary secondary] }
  validates :engineer_id, uniqueness: { scope: :skill_id }

  # Scopes
  scope :primary, -> { where(level: 'primary') }
  scope :secondary, -> { where(level: 'secondary') }
  scope :by_skill, ->(skill_name) { joins(:skill).where(skills: { name: skill_name }) }

  # Class methods
  def self.primary_skills_for(engineer)
    where(engineer: engineer, level: 'primary').includes(:skill)
  end

  def self.secondary_skills_for(engineer)
    where(engineer: engineer, level: 'secondary').includes(:skill)
  end

  # Instance methods
  def primary?
    level == 'primary'
  end

  def secondary?
    level == 'secondary'
  end

  def skill_name
    skill.name
  end

  def engineer_name
    engineer.name
  end
end
