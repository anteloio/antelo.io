module Timesheet
  class ProjectsController < BaseController
    def create
      current_user.projects.create!(params.expect(project: [:name]))
      redirect_to_timesheet notice: 'Project added'
    end

    def update
      current_user.projects.find(params[:id]).update!(project_params)
      redirect_to_timesheet
    end

    def destroy
      current_user.projects.find(params[:id]).destroy!
      redirect_to_timesheet notice: 'Project deleted'
    end

    private

    def project_params
      permitted = params.expect(project: %i[name hourly_rate])
      permitted[:hourly_rate] = nil if permitted[:hourly_rate].blank?
      permitted
    end

    def redirect_to_timesheet(notice: nil)
      redirect_to timesheet_path(start: params[:start].presence), notice: notice
    end
  end
end
