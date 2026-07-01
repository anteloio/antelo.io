Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
           Rails.application.credentials.dig(:google, :client_id),
           Rails.application.credentials.dig(:google, :client_secret),
           # Reuse the redirect URI already registered in Google Cloud Console
           # (http://localhost:4321/api/auth/callback/google and the antelo.io one).
           callback_path: '/api/auth/callback/google'
end

OmniAuth.config.allowed_request_methods = %i[get]
OmniAuth.config.silence_get_warning = true
