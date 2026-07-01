Rails.application.routes.draw do
  root 'pages#home'

  get '/blog', to: 'posts#index', as: :posts
  get '/blog/:id', to: 'posts#show', as: :post

  get '/x', to: 'tweets#index', as: :tweets
  post '/tweets/:id/toggle_sent', to: 'tweets#toggle_sent', as: :toggle_sent_tweet

  # Authentication: Google via OmniAuth, no Devise. The callback path matches the
  # redirect URI already registered in Google Cloud Console (it was Better Auth's).
  get '/login', to: 'sessions#new', as: :login
  get '/api/auth/callback/google', to: 'sessions#create'
  get '/auth/failure', to: 'sessions#failure'
  get '/sign_out', to: 'sessions#destroy', as: :sign_out

  # Timesheet. Internal apps each get their own namespace; everything the app
  # owns (routes, controllers, views) lives under it.
  get '/timesheet', to: 'timesheet/weeks#show', as: :timesheet
  namespace :timesheet do
    get 'report', to: 'reports#show'
    post 'time_entries', to: 'time_entries#upsert'
    post 'day_locations', to: 'day_locations#upsert'
    resources :projects, only: %i[create update destroy]
    resources :locations, only: %i[create update destroy]
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get 'up' => 'rails/health#show', :as => :rails_health_check
end
