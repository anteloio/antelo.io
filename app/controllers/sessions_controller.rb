class SessionsController < ApplicationController
  def new
    redirect_to timesheet_path if current_user
  end

  def create
    user = User.find_or_create_with_omniauth(request.env['omniauth.auth'])
    session[:user_id] = user.id
    redirect_to after_sign_in_path, notice: "Signed in as #{user.name}"
  end

  def failure
    redirect_to login_path, alert: 'Authentication failed. Please try again.'
  end

  def destroy
    session[:user_id] = nil
    redirect_to login_path, notice: 'Signed out'
  end

  private

  def after_sign_in_path
    request.env['omniauth.params']&.[]('after_sign_in_path') || timesheet_path
  end
end
