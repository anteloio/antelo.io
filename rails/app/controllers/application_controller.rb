class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  # antelo.io is the canonical host; send www traffic there for SEO.
  before_action :redirect_to_naked_domain, if: -> { Rails.env.production? && request.host.start_with?('www.') }

  helper_method :current_user

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def require_user
    redirect_to login_path unless current_user
  end

  def redirect_to_naked_domain
    redirect_to "https://antelo.io#{request.fullpath}", status: :moved_permanently, allow_other_host: true
  end
end
