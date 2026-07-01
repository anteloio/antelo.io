module Timesheet
  class TimeEntriesController < BaseController
    # One entry per project per day: setting hours creates or updates, zero deletes.
    def upsert
      project = current_user.projects.find(params[:project_id])
      date = Date.iso8601(params[:date])
      hours = params[:hours].to_f

      entry = current_user.time_entries.find_or_initialize_by(project: project, date: date)
      if hours.positive?
        entry.update!(hours: hours)
        flash.notice = 'Saved'
      elsif entry.persisted?
        entry.destroy!
      end

      redirect_to timesheet_path(start: params[:start].presence)
    end
  end
end
