class User < ApplicationRecord
  # Authentication validations
  validates :provider, presence: true
  validates :uid, presence: true, uniqueness: { scope: :provider }
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true

  # Scopes
  scope :by_provider, ->(provider) { where(provider: provider) }
  scope :active, -> { where.not(token: nil) }

  # Class methods
  def self.find_or_create_from_omniauth(auth)
    find_or_create_by(provider: auth.provider, uid: auth.uid) do |user|
      user.name = auth.info.name
      user.email = auth.info.email
      user.image_url = auth.info.image
      user.token = auth.credentials.token
      user.token_expires_at = Time.at(auth.credentials.expires_at) if auth.credentials.expires_at
    end
  end

  # Instance methods
  def admin?
    role == "admin"
  end

  def manager?
    role == "manager" || admin?
  end

  def token_expired?
    token_expires_at && token_expires_at < Time.current
  end
end
