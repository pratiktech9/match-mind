class ClientSkill < ApplicationRecord
  # Associations
  belongs_to :client
  belongs_to :skill

  # Validations
  validates :importance, presence: true, inclusion: { in: %w[required preferred nice_to_have] }
  validates :client_id, uniqueness: { scope: :skill_id }

  # Scopes
  scope :required, -> { where(importance: 'required') }
  scope :preferred, -> { where(importance: 'preferred') }
  scope :nice_to_have, -> { where(importance: 'nice_to_have') }
  scope :high_priority, -> { where(importance: ['required', 'preferred']) }
  scope :by_skill, ->(skill_name) { joins(:skill).where(skills: { name: skill_name }) }

  # Class methods
  def self.required_skills_for(client)
    where(client: client, importance: 'required').includes(:skill)
  end

  def self.preferred_skills_for(client)
    where(client: client, importance: 'preferred').includes(:skill)
  end

  def self.nice_to_have_skills_for(client)
    where(client: client, importance: 'nice_to_have').includes(:skill)
  end

  # Instance methods
  def required?
    importance == 'required'
  end

  def preferred?
    importance == 'preferred'
  end

  def nice_to_have?
    importance == 'nice_to_have'
  end

  def high_priority?
    required? || preferred?
  end

  def skill_name
    skill.name
  end

  def client_name
    client.name
  end

  def importance_weight
    case importance
    when 'required' then 3
    when 'preferred' then 2
    when 'nice_to_have' then 1
    else 0
    end
  end
end
