Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
           ENV["GOOGLE_CLIENT_ID"],
           ENV["GOOGLE_CLIENT_SECRET"],
           {
             scope: "email,profile",
             prompt: "select_account",
             image_aspect_ratio: "square",
             image_size: 50,
             access_type: "offline",
             hd: ENV["GOOGLE_HD_DOMAIN"] # Restrict to specific domain (e.g., your company domain)
           }
end

# Configure OmniAuth to work with Rails CSRF protection
OmniAuth.config.allowed_request_methods = [ :post, :get ]
OmniAuth.config.silence_get_warning = true
