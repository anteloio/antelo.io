class TimesheetsController < ApplicationController
  before_action :require_user

  def show
    @week = Week.new(params[:start])
    @projects = current_user.projects.alphabetical
    @locations = current_user.locations.alphabetical

    @entries =
      current_user
        .time_entries
        .where(date: @week.range)
        .pluck(:project_id, :date, :hours)
        .to_h { |project_id, date, hours| [[project_id, date], hours] }
    @entry_counts = current_user.time_entries.group(:project_id).count

    @day_locations = current_user.day_locations.where(date: @week.range).pluck(:date, :location_id).to_h
    @location_counts = current_user.day_locations.group(:location_id).count
  end
end
