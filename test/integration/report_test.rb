require 'test_helper'

class ReportTest < ActionDispatch::IntegrationTest
  setup do
    @user = create_user
    sign_in @user
  end

  test 'sums hours, days and value per project for the month' do
    kali = @user.projects.create!(name: 'kali', hourly_rate: 120)
    seamflow = @user.projects.create!(name: 'seamflow')

    @user.time_entries.create!(project: kali, date: Date.new(2026, 6, 1), hours: 6)
    @user.time_entries.create!(project: kali, date: Date.new(2026, 6, 2), hours: 2)
    @user.time_entries.create!(project: seamflow, date: Date.new(2026, 6, 2), hours: 3)
    # Outside the month, must not count:
    @user.time_entries.create!(project: kali, date: Date.new(2026, 7, 1), hours: 8)

    get timesheet_report_path(month: '2026-06')
    assert_response :success
    assert_includes response.body, 'june 2026'
    assert_includes response.body, '$960' # 8h * $120
    assert_includes response.body, '11<span' # total hours
    assert_includes response.body, '>2</td>' # working days (distinct dates)
  end

  test 'empty month renders the empty state' do
    get timesheet_report_path(month: '1999-01')
    assert_response :success
    assert_includes response.body, 'No hours logged in January 1999'
  end
end
