class Engineer < ApplicationRecord
  # Associations
  has_many :engineer_skills, dependent: :destroy
  has_many :skills, through: :engineer_skills
  has_many :matches, dependent: :destroy
  has_many :clients, through: :matches

  # Validations
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :status, presence: true
  validates :utilization, numericality: { in: 0..100 }, allow_nil: true
  validates :target_rate, numericality: { greater_than: 0 }, allow_nil: true

  # Scopes
  scope :available, -> { where(status: 'available') }
  scope :rolling_off_soon, -> { where(status: 'rolling_off_soon') }
  scope :on_project, -> { where(status: 'on_project') }
  scope :by_country, ->(country) { where(country: country) }
  scope :by_industry, ->(industry) { where(industry_experience: industry) }
  scope :by_utilization, ->(min, max = 100) { where(utilization: min..max) }
  scope :with_skills, ->(skill_names) { joins(:skills).where(skills: { name: skill_names }) }

  # Class methods
  def self.search(query)
    where(
      "name ILIKE ? OR email ILIKE ? OR current_client ILIKE ? OR industry_experience ILIKE ?",
      "%#{query}%", "%#{query}%", "%#{query}%", "%#{query}%"
    )
  end

  def self.rolling_off_within_days(days)
    where(notice_date: Date.current..days.days.from_now)
  end

  def self.returning_within_days(days)
    where(return_date: Date.current..days.days.from_now)
  end

  # Instance methods
  def available?
    status == 'available'
  end

  def rolling_off_soon?
    status == 'rolling_off_soon'
  end

  def on_project?
    status == 'on_project'
  end

  def primary_skills
    engineer_skills.where(level: 'primary').includes(:skill)
  end

  def secondary_skills
    engineer_skills.where(level: 'secondary').includes(:skill)
  end

  def skill_names
    skills.pluck(:name)
  end

  def days_until_notice
    return nil unless notice_date
    (notice_date - Date.current).to_i
  end

  def days_until_return
    return nil unless return_date
    (return_date - Date.current).to_i
  end

  def utilization_percentage
    utilization || 0
  end

  def fullstack?
    skill_names.any? { |skill| skill.downcase.include?('fullstack') }
  end

  def frontend?
    skill_names.any? { |skill| skill.downcase.include?('frontend') || skill.downcase.include?('react') || skill.downcase.include?('vue') || skill.downcase.include?('angular') }
  end

  def backend?
    skill_names.any? { |skill| skill.downcase.include?('backend') || skill.downcase.include?('rails') || skill.downcase.include?('node') || skill.downcase.include?('python') }
  end
end
