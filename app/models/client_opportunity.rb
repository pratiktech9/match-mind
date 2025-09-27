class ClientOpportunity < ApplicationRecord
  belongs_to :client
  has_many :client_opportunity_skills, dependent: :destroy
  has_many :skills, through: :client_opportunity_skills
  has_many :matches, dependent: :destroy

  validates :title, presence: true
  validates :geo, presence: true
  validates :employment_type, presence: true
  validates :job_role, presence: true
  validates :status, inclusion: { in: %w[active inactive closed filled] }
  validates :priority, inclusion: { in: %w[low medium high urgent] }

  scope :active, -> { where(status: "active") }
  scope :by_geo, ->(geo) { where(geo: geo) }
  scope :by_employment_type, ->(type) { where(employment_type: type) }
  scope :by_job_role, ->(role) { where(job_role: role) }
  scope :by_priority, ->(priority) { where(priority: priority) }

  def required_skills
    skills.where(client_opportunity_skills: { required: true })
  end

  def optional_skills
    skills.where(client_opportunity_skills: { required: false })
  end

  def skill_importance(skill)
    client_opportunity_skills.find_by(skill: skill)&.importance
  end

  def is_skill_required?(skill)
    client_opportunity_skills.find_by(skill: skill)&.required || false
  end
end
