class SessionsController < ApplicationController
  def google_auth
    auth = request.env['omniauth.auth']
    
    user = User.find_or_create_by(provider: auth.provider, uid: auth.uid) do |u|
      u.name = auth.info.name
      u.email = auth.info.email
      u.image_url = auth.info.image
      u.token = auth.credentials.token
      u.token_expires_at = Time.at(auth.credentials.expires_at)
    end

    session[:user_id] = user.id
    redirect_to root_path, notice: "Signed in as #{user.name}"
  end

  def destroy
    session[:user_id] = nil
    redirect_to root_path, notice: "Signed out"
  end
end
