---
title: "How to Add Google Sign-In to Rails Without Using Devise"
description: "Implement Google login on your Ruby on Rails app with pure Omniauth, no Devise required."
publishedAt: 2023-08-31
---

Implement Google login on your Ruby on Rails app with pure Omniauth.

In another article, I explained how to implement Google OAuth by using Devise. Devise has its advantages if you're planning to implement more complex login flows or options, such as login via email, recovering passwords, expiring sessions, etc.

However, if you want to stick with the bare minimum, relying purely on the Omniauth gem is the approach described here.

## Add dependencies to your Gemfile

```ruby
gem 'omniauth-google-oauth2'
```

Then run `bundle install` to install the dependency.

## Create the :users table

The absolute minimum is email, provider, and uid, but a few extra columns such as image, first name, and last name are recommended.

Generate your migration file with:

```bash
rails g model User first_name last_name email avatar_url provider uid
```

This will create a migration file:

```ruby
# db/migrate/20250329060602_create_users.rb

class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :first_name
      t.string :last_name
      t.string :email
      t.string :avatar_url
      t.string :provider
      t.string :uid

      t.timestamps
    end
  end
end
```

Now run the migration to create the table:

```bash
rails db:migrate
```

## Update the User model

Inside the User model, provide a few helpers, such as name, to concatenate both first and last names into a single string.

```ruby
# app/models/user.rb

class User < ApplicationRecord
  def name
    [first_name, last_name].join(' ')
  end

  def update_dynamic_attributes(auth)
    self.first_name = auth.info.first_name
    self.last_name = auth.info.last_name
    self.email = auth.info.email
    self.avatar_url = auth.info.image if auth.info.image?
  end

  class << self
    def find_or_create_with_omniauth(auth)
      user = find_by(auth.slice(:provider, :uid)) || initialize_from_omniauth(auth)
      user.update_dynamic_attributes(auth)
      user.save!
      user
    end

    def initialize_from_omniauth(auth)
      new do |user|
        user.provider = auth.provider
        user.uid = auth.uid
      end
    end
  end
end
```

## Rails Routes

Add a required callback route, but also two custom routes for the convenience of using `sign_in_path` and `sign_out_path`:

```ruby
# config/routes.rb

Rails.application.routes.draw do
  # AUTHENTICATION ROUTES
  get 'auth/:provider/callback', to: 'sessions#create'
  get '/sign_out', to: 'sessions#destroy', as: :sign_out
  get '/auth/google_oauth2', as: :sign_in
  get '/auth/failure' => 'sessions#failure'
end
```

Create your Omniauth initializer file:

```ruby
# config/omniauth.rb

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
           Rails.application.credentials.dig(:google, :client_id),
           Rails.application.credentials.dig(:google, :client_secret)
end

OmniAuth.config.allowed_request_methods = %i[get]
```

On your controller, handle sign in, sign out, and eventual failures:

```ruby
# app/controllers/sessions_controller.rb

class SessionsController < ApplicationController
  def create
    user = User.find_or_create_with_omniauth(request.env['omniauth.auth'])
    session[:user_id] = user.id
    redirect_to after_sign_in_path, notice: "Signed in as #{user.name}"
  end

  def failure
    # Sentry.capture_message(params[:message])
    redirect_to root_url, alert: 'Authentication failed.'
  end

  def destroy
    session[:user_id] = nil
    redirect_to root_url, notice: 'Signed out'
  end

  private

  def after_sign_in_path
    # Try to get the custom path passed as a param (e.g., ?after_sign_in_path=/dashboard)
    after_sign_in_param = request.env["omniauth.params"]&.[]("after_sign_in_path")

    # Fallback to the original URL the user came from before being redirected to sign in
    origin_url = request.env["omniauth.origin"]

    # Return the first available option: custom param > origin > root
    after_sign_in_param || origin_url || root_path
  end
end
```

## Add a current_user method

Create a convenient method, `current_user`:

```ruby
# app/controllers/application_controller.rb

class ApplicationController < ActionController::Base
  helper_method :current_user

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end
end
```

## Allow users to sign in and sign out

Add a couple of links to your views so that users can log in and log out:

```erb
<% if current_user %>
  Signed in as <%= current_user.name %>
  <%= link_to 'Sign out', sign_out_path %>
<% else %>
  <%= link_to 'Sign in with google', sign_in_path %>
<% end %>
```

## Demo

I used this approach to implement login for my technical debt tracker app at cherrypush.com.
