class ReportsController < ApplicationController
  before_action :require_user

  def show
    @month = Month.new(params[:month])

    scope = current_user.time_entries.where(date: @month.range)
    @report =
      scope
        .joins(:project)
        .group('projects.id', 'projects.name', 'projects.hourly_rate')
        .order('projects.name')
        .pluck('projects.name', 'projects.hourly_rate', Arel.sql('sum(time_entries.hours)'), Arel.sql('count(*)'))
        .map do |name, rate, hours, days|
          { name: name, rate: rate, hours: hours, days: days, value: rate ? hours * rate : nil }
        end

    # Distinct days worked across all projects (a day can hold more than one project).
    @working_days = scope.distinct.count(:date)
    @total_hours = @report.sum { |row| row[:hours] }
    @total_value = @report.sum { |row| row[:value] || 0 }
    @has_any_rate = @report.any? { |row| row[:rate].to_f > 0 }
  end
end
