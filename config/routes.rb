Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Sidekiq Web UI (for monitoring background jobs)
  require "sidekiq/web"
  mount Sidekiq::Web => "/sidekiq"

  # API routes
  namespace :api do
    namespace :v1 do
      resources :engineers
      resources :skills, only: [ :index, :show ]
      resources :clients
      resources :opportunities
      resources :matches, only: [ :index, :show, :create, :destroy ]
      resources :notifications do
        member do
          patch :mark_read
          patch :mark_unread
          patch :archive
        end
        collection do
          patch :mark_all_read
          get :summary
          post :generate_insights
        end
      end

      # Dashboard routes
      get "dashboard/stats", to: "dashboard#stats"
      get "dashboard/availability-calendar", to: "dashboard#availability_calendar"
      get "dashboard/urgent-matches", to: "dashboard#urgent_matches"
    end
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Authentication routes
  get "/auth/:provider/callback", to: "sessions#google_auth"
  get "/auth/failure", to: "sessions#failure"
  delete "/logout", to: "sessions#destroy", as: :logout

  # API routes
  namespace :api do
    get "current_user", to: "users#show"

    # AI Matching routes
    get "opportunities/:opportunity_id/matches", to: "matching#find_matches_for_opportunity"
    get "engineers/:engineer_id/matches", to: "matching#find_matches_for_engineer"
    post "matches", to: "matching#create_match"

    # Matching management routes
    get "matches", to: "matching#index"
    post "matching/trigger", to: "matching#trigger_matching"
    patch "matches/:id/status", to: "matching#update_match_status"
    get "matches/recent", to: "matching#get_recent_matches"
  end

  # Defines the root path route ("/")
  root "home#index"
end
