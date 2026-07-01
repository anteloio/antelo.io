class DayLocationsController < ApplicationController
  before_action :require_user

  # One location per day: picking one creates or updates, clearing deletes.
  def upsert
    date = Date.iso8601(params[:date])
    location_id = params[:location_id].to_i

    if location_id.positive?
      location = current_user.locations.find(location_id)
      day_location = current_user.day_locations.find_or_initialize_by(date: date)
      day_location.update!(location: location)
    else
      current_user.day_locations.where(date: date).destroy_all
    end

    redirect_to timesheet_path(start: params[:start].presence)
  end
end
