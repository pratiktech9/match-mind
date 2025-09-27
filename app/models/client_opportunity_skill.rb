class ClientOpportunitySkill < ApplicationRecord
  belongs_to :client_opportunity
  belongs_to :skill

  validates :importance, presence: true, inclusion: { in: 1..5 }
  validates :required, inclusion: { in: [ true, false ] }
  validates :skill_id, uniqueness: { scope: :client_opportunity_id }

  scope :required, -> { where(required: true) }
  scope :optional, -> { where(required: false) }
  scope :by_importance, ->(level) { where(importance: level) }
end
