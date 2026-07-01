require 'test_helper'

class TimesheetTest < ActionDispatch::IntegrationTest
  setup do
    @user = create_user
    @project = @user.projects.create!(name: 'kali', hourly_rate: 120)
    sign_in @user
  end

  test 'shows the week grid with entries' do
    @user.time_entries.create!(project: @project, date: Date.current, hours: 6)

    get timesheet_path
    assert_response :success
    assert_includes response.body, 'kali'
    assert_includes response.body, '$720'
  end

  test 'set hours upserts a single entry per project and day' do
    date = Date.current.beginning_of_week

    assert_difference 'TimeEntry.count', 1 do
      post time_entries_path, params: { project_id: @project.id, date: date, hours: 4 }
    end
    assert_redirected_to timesheet_path

    assert_no_difference 'TimeEntry.count' do
      post time_entries_path, params: { project_id: @project.id, date: date, hours: 7.5 }
    end
    assert_equal 7.5, @project.time_entries.find_by(date: date).hours

    assert_difference 'TimeEntry.count', -1 do
      post time_entries_path, params: { project_id: @project.id, date: date, hours: 0 }
    end
  end

  test "cannot log hours on another user's project" do
    other = create_user(email: 'other@example.com')
    other_project = other.projects.create!(name: 'secret')

    post time_entries_path, params: { project_id: other_project.id, date: Date.current, hours: 4 }
    assert_response :not_found
  end

  test 'projects crud' do
    assert_difference 'Project.count', 1 do
      post projects_path, params: { project: { name: 'seamflow' } }
    end

    project = @user.projects.find_by(name: 'seamflow')
    patch project_path(project), params: { project: { name: 'seamflow2', hourly_rate: '90' } }
    project.reload
    assert_equal ['seamflow2', 90.0], [project.name, project.hourly_rate]

    patch project_path(project), params: { project: { name: 'seamflow2', hourly_rate: '' } }
    assert_nil project.reload.hourly_rate

    @user.time_entries.create!(project: project, date: Date.current, hours: 2)
    assert_difference %w[Project.count TimeEntry.count], -1 do
      delete project_path(project)
    end
  end

  test 'day locations upsert and clear' do
    location = @user.locations.create!(name: 'Paris')
    date = Date.current

    post day_locations_path, params: { date: date, location_id: location.id }
    assert_equal location.id, @user.day_locations.find_by(date: date).location_id

    other = @user.locations.create!(name: 'Remote')
    assert_no_difference 'DayLocation.count' do
      post day_locations_path, params: { date: date, location_id: other.id }
    end
    assert_equal other.id, @user.day_locations.find_by(date: date).location_id

    assert_difference 'DayLocation.count', -1 do
      post day_locations_path, params: { date: date, location_id: 0 }
    end
  end

  test 'deleting a location removes its day assignments' do
    location = @user.locations.create!(name: 'Paris')
    @user.day_locations.create!(location: location, date: Date.current)

    assert_difference %w[Location.count DayLocation.count], -1 do
      delete location_path(location)
    end
  end
end
