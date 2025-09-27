class Skill < ApplicationRecord
  # Associations
  has_many :engineer_skills, dependent: :destroy
  has_many :engineers, through: :engineer_skills
  has_many :client_skills, dependent: :destroy
  has_many :clients, through: :client_skills

  # Validations
  validates :name, presence: true, uniqueness: true

  # Scopes
  scope :by_category, ->(category) { where("name ILIKE ?", "%#{category}%") }
  scope :popular, -> { joins(:engineer_skills).group("skills.id").order("COUNT(engineer_skills.id) DESC") }

  # Class methods
  def self.search(query)
    where("name ILIKE ?", "%#{query}%")
  end

  def self.tech_stack
    where("name ILIKE ? OR name ILIKE ? OR name ILIKE ? OR name ILIKE ? OR name ILIKE ?",
          "%frontend%", "%backend%", "%fullstack%", "%react%", "%rails%")
  end

  def self.programming_languages
    where("name ILIKE ? OR name ILIKE ? OR name ILIKE ? OR name ILIKE ? OR name ILIKE ? OR name ILIKE ?",
          "%ruby%", "%python%", "%javascript%", "%typescript%", "%java%", "%go%")
  end

  def self.frameworks
    where("name ILIKE ? OR name ILIKE ? OR name ILIKE ? OR name ILIKE ? OR name ILIKE ?",
          "%rails%", "%react%", "%vue%", "%angular%", "%node%")
  end

  def self.databases
    where("name ILIKE ? OR name ILIKE ? OR name ILIKE ? OR name ILIKE ?",
          "%postgresql%", "%mysql%", "%mongodb%", "%redis%")
  end

  # Instance methods
  def engineer_count
    engineers.count
  end

  def client_count
    clients.count
  end

  def demand_score
    client_count * 2 + engineer_count
  end

  def is_tech_stack?
    name.downcase.include?("frontend") || name.downcase.include?("backend") || name.downcase.include?("fullstack")
  end

  def is_programming_language?
    %w[ruby python javascript typescript java go php c# swift kotlin].any? { |lang| name.downcase.include?(lang) }
  end

  def is_framework?
    %w[rails react vue angular node django flask spring].any? { |framework| name.downcase.include?(framework) }
  end

  def is_database?
    %w[postgresql mysql mongodb redis sqlite].any? { |db| name.downcase.include?(db) }
  end

  def category
    return "tech_stack" if is_tech_stack?
    return "programming_language" if is_programming_language?
    return "framework" if is_framework?
    return "database" if is_database?
    "other"
  end
end
