class Client < ApplicationRecord
  # Associations
  has_many :client_opportunities, dependent: :destroy
  has_many :matches, dependent: :destroy
  has_many :engineers, through: :matches

  # Validations
  validates :name, presence: true
  validates :industry, presence: true

  # Scopes
  scope :by_industry, ->(industry) { where(industry: industry) }
  scope :active, -> { joins(:client_opportunities).where(client_opportunities: { status: "active" }).distinct }

  # Methods
  def active_opportunities
    client_opportunities.active
  end

  def total_budget
    client_opportunities.active.sum(:budget)
  end

  def skills_used
    Skill.joins(:client_opportunity_skills)
         .joins(:client_opportunities)
         .where(client_opportunities: { client_id: id })
         .distinct
  end
end
