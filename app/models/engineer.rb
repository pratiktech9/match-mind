class Engineer < ApplicationRecord
  # Associations
  has_many :engineer_skills, dependent: :destroy
  has_many :skills, through: :engineer_skills
  has_many :matches, dependent: :destroy
  has_many :clients, through: :matches
  belongs_to :current_client, class_name: "Client", optional: true

  # Validations
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :utilization, numericality: { in: 0..100 }, allow_nil: true
  validates :target_rate, numericality: { greater_than: 0 }, allow_nil: true

  # Callbacks
  before_save :calculate_status_from_dates
  after_update :create_availability_change_notification, if: :saved_change_to_status?

  # Scopes
  scope :available, -> { where(status: "available") }
  scope :rolling_off_soon, -> { where(status: "rolling_off_soon") }
  scope :on_project, -> { where(status: "on_project") }
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
    status == "available"
  end

  def rolling_off_soon?
    status == "rolling_off_soon"
  end

  def on_project?
    status == "on_project"
  end

  def primary_skills
    engineer_skills.where(level: "primary").includes(:skill)
  end

  def secondary_skills
    engineer_skills.where(level: "secondary").includes(:skill)
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
    skill_names.any? { |skill| skill.downcase.include?("fullstack") }
  end

  def frontend?
    skill_names.any? { |skill| skill.downcase.include?("frontend") || skill.downcase.include?("react") || skill.downcase.include?("vue") || skill.downcase.include?("angular") }
  end

  def backend?
    skill_names.any? { |skill| skill.downcase.include?("backend") || skill.downcase.include?("rails") || skill.downcase.include?("node") || skill.downcase.include?("python") }
  end

  # Calculate status based on dates
  def calculate_status_from_dates_preview(notice_date_param = nil, expected_end_date_param = nil, return_date_param = nil, current_client_id_param = nil)
    # Use provided parameters or current values
    notice_date_to_use = notice_date_param&.present? ? Date.parse(notice_date_param.to_s) : notice_date
    expected_end_date_to_use = expected_end_date_param&.present? ? Date.parse(expected_end_date_param.to_s) : expected_end_date
    return_date_to_use = return_date_param&.present? ? Date.parse(return_date_param.to_s) : return_date
    current_client_id_to_use = current_client_id_param&.present? ? current_client_id_param : current_client_id

    calculate_status_logic(notice_date_to_use, expected_end_date_to_use, return_date_to_use, current_client_id_to_use)
  end

  def calculate_status_from_dates_current
    calculate_status_logic(notice_date, expected_end_date, return_date, current_client_id)
  end

  private

  def calculate_status_from_dates
    new_status = calculate_status_from_dates_current
    self.status = new_status if new_status
  end

  def calculate_status_logic(notice_date_val, expected_end_date_val, return_date_val, current_client_id_val)
    today = Date.current

    # If engineer has a current client ID, they're either on project or rolling off soon
    if current_client_id_val.present?
      # Check if they're rolling off soon (notice given and within 30 days)
      if notice_date_val.present? && notice_date_val >= today && notice_date_val <= today + 30.days
        "rolling_off_soon"
      # Check if project is ending soon (expected end date within 30 days)
      elsif expected_end_date_val.present? && expected_end_date_val >= today && expected_end_date_val <= today + 30.days
        "rolling_off_soon"
      else
        # Currently working on project
        "on_project"
      end
    else
      # No current client - check if they're returning from a break
      if return_date_val.present? && return_date_val > today
        # Still on break, will return in future
        "on_project" # Consider them unavailable until return date
      else
        # Available for new projects
        "available"
      end
    end
  end

  def create_availability_change_notification
    old_status = saved_changes["status"][0]
    new_status = saved_changes["status"][1]

    # Only create notification if status actually changed
    if old_status != new_status
      Notification.create_availability_change_notification(self, old_status, new_status)
    end
  end
end
