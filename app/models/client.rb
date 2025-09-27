class Client < ApplicationRecord
  # Associations
  has_many :client_skills, dependent: :destroy
  has_many :skills, through: :client_skills
  has_many :matches, dependent: :destroy
  has_many :engineers, through: :matches

  # Validations
  validates :name, presence: true
  validates :geo, presence: true
  validates :industry, presence: true
  validates :employment_type, presence: true
end
