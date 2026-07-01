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

  get '/timesheet', to: 'timesheets#show', as: :timesheet
  get '/timesheet/report', to: 'reports#show', as: :report

  resources :projects, only: %i[create update destroy]
  resources :locations, only: %i[create update destroy]
  post '/time_entries', to: 'time_entries#upsert', as: :time_entries
  post '/day_locations', to: 'day_locations#upsert', as: :day_locations

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get 'up' => 'rails/health#show', :as => :rails_health_check
end
