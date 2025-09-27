class Api::UsersController < ApplicationController
  def show
    if session[:user_id]
      user = User.find(session[:user_id])
      render json: { user: user.as_json(only: [ :id, :name, :email, :image_url, :role ]) }
    else
      render json: { user: nil }
    end
  end
end
