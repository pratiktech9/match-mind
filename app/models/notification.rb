class Notification < ApplicationRecord
  # Associations
  belongs_to :engineer, optional: true
  belongs_to :client, optional: true
  belongs_to :client_opportunity, optional: true

  # Validations
  validates :title, presence: true
  validates :message, presence: true
  validates :notification_type, presence: true, inclusion: { 
    in: %w[rolling_off_soon potential_match high_score_match new_opportunity skill_gap budget_mismatch availability_change] 
  }
  validates :priority, presence: true, inclusion: { in: %w[low medium high urgent] }
  validates :status, presence: true, inclusion: { in: %w[unread read archived] }

  # Scopes
  scope :unread, -> { where(status: 'unread') }
  scope :read, -> { where(status: 'read') }
  scope :archived, -> { where(status: 'archived') }
  scope :by_priority, ->(priority) { where(priority: priority) }
  scope :by_type, ->(type) { where(notification_type: type) }
  scope :recent, -> { order(created_at: :desc) }
  scope :urgent, -> { where(priority: 'urgent') }
  scope :high_priority, -> { where(priority: ['high', 'urgent']) }

  # Class methods
  def self.create_rolling_off_notification(engineer)
    days_until_rolloff = engineer.days_until_notice
    return unless days_until_rolloff && days_until_rolloff <= 30

    priority = case days_until_rolloff
               when 0..7 then 'urgent'
               when 8..14 then 'high'
               when 15..30 then 'medium'
               else 'low'
               end

    create!(
      title: "Engineer Rolling Off Soon",
      message: "#{engineer.name} is rolling off in #{days_until_rolloff} days. Consider matching them with new opportunities.",
      notification_type: 'rolling_off_soon',
      priority: priority,
      status: 'unread',
      engineer: engineer
    )
  end

  def self.create_potential_match_notification(engineer, opportunity, score)
    priority = case score
               when 90..100 then 'high'
               when 80..89 then 'medium'
               when 70..79 then 'low'
               else return # Don't create notifications for low scores
               end

    create!(
      title: "High-Score Match Found",
      message: "#{engineer.name} has a #{score}% match with #{opportunity.title} at #{opportunity.client.name}.",
      notification_type: 'potential_match',
      priority: priority,
      status: 'unread',
      engineer: engineer,
      client: opportunity.client,
      client_opportunity: opportunity
    )
  end

  def self.create_new_opportunity_notification(opportunity)
    create!(
      title: "New Opportunity Available",
      message: "New opportunity: #{opportunity.title} at #{opportunity.client.name}. Consider running matching to find suitable engineers.",
      notification_type: 'new_opportunity',
      priority: 'medium',
      status: 'unread',
      client: opportunity.client,
      client_opportunity: opportunity
    )
  end

  def self.create_skill_gap_notification(opportunity)
    required_skills = opportunity.required_skills.pluck(:name)
    available_engineers = Engineer.available.includes(:skills)
    
    engineers_with_skills = available_engineers.select do |engineer|
      engineer_skills = engineer.skills.pluck(:name)
      (required_skills & engineer_skills).any?
    end

    if engineers_with_skills.empty?
      create!(
        title: "Skill Gap Alert",
        message: "No available engineers have the required skills for #{opportunity.title}. Consider training or hiring.",
        notification_type: 'skill_gap',
        priority: 'high',
        status: 'unread',
        client: opportunity.client,
        client_opportunity: opportunity
      )
    end
  end

  def self.create_budget_mismatch_notification(engineer, opportunity)
    return unless opportunity.budget && engineer.target_rate

    budget_hourly = opportunity.budget / 2000
    if budget_hourly < engineer.target_rate * 0.8
      create!(
        title: "Budget Mismatch",
        message: "#{engineer.name}'s target rate (#{engineer.target_rate}/hr) is higher than opportunity budget (#{budget_hourly.round}/hr) for #{opportunity.title}.",
        notification_type: 'budget_mismatch',
        priority: 'medium',
        status: 'unread',
        engineer: engineer,
        client: opportunity.client,
        client_opportunity: opportunity
      )
    end
  end

  def self.create_availability_change_notification(engineer, old_status, new_status)
    create!(
      title: "Engineer Availability Changed",
      message: "#{engineer.name} status changed from #{old_status} to #{new_status}. Consider updating their matches.",
      notification_type: 'availability_change',
      priority: 'medium',
      status: 'unread',
      engineer: engineer
    )
  end

  # Instance methods
  def mark_as_read!
    update!(status: 'read', read_at: Time.current)
  end

  def mark_as_unread!
    update!(status: 'unread', read_at: nil)
  end

  def archive!
    update!(status: 'archived')
  end

  def unread?
    status == 'unread'
  end

  def read?
    status == 'read'
  end

  def archived?
    status == 'archived'
  end

  def urgent?
    priority == 'urgent'
  end

  def high_priority?
    %w[high urgent].include?(priority)
  end

  def time_ago
    time_diff = Time.current - created_at
    case time_diff
    when 0..59 then "#{time_diff.to_i} seconds ago"
    when 60..3599 then "#{(time_diff / 60).to_i} minutes ago"
    when 3600..86399 then "#{(time_diff / 3600).to_i} hours ago"
    else "#{(time_diff / 86400).to_i} days ago"
    end
  end

  def icon
    case notification_type
    when 'rolling_off_soon' then '⏰'
    when 'potential_match' then '🎯'
    when 'new_opportunity' then '💼'
    when 'skill_gap' then '⚠️'
    when 'budget_mismatch' then '💰'
    when 'availability_change' then '🔄'
    else '📢'
    end
  end

  def priority_color
    case priority
    when 'urgent' then 'danger'
    when 'high' then 'warning'
    when 'medium' then 'info'
    when 'low' then 'secondary'
    else 'secondary'
    end
  end
end