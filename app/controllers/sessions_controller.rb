class SessionsController < ApplicationController
  def google_auth
    auth = request.env["omniauth.auth"]

    begin
      user = User.find_or_create_from_omniauth(auth)

      # Check if user is from allowed domain (internal users only)
      unless user.internal_user?
        redirect_to root_path, alert: "Access denied. Only internal users are allowed to access this application."
        return
      end

      session[:user_id] = user.id
      redirect_to root_path, notice: "Signed in as #{user.name}"
    rescue => e
      Rails.logger.error "OAuth authentication error: #{e.message}"
      redirect_to root_path, alert: "Authentication failed. Please try again."
    end
  end

  def destroy
    session[:user_id] = nil
    redirect_to root_path, notice: "Signed out"
  end

  def failure
    redirect_to root_path, alert: "Authentication failed. Please try again."
  end
end
