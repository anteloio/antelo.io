class LocationsController < ApplicationController
  before_action :require_user

  def create
    current_user.locations.create!(params.expect(location: [:name]))
    redirect_to_timesheet notice: 'Location added'
  end

  def update
    current_user.locations.find(params[:id]).update!(params.expect(location: [:name]))
    redirect_to_timesheet
  end

  def destroy
    current_user.locations.find(params[:id]).destroy!
    redirect_to_timesheet notice: 'Location deleted'
  end

  private

  def redirect_to_timesheet(notice: nil)
    redirect_to timesheet_path(start: params[:start].presence), notice: notice
  end
end
