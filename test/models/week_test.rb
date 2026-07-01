require 'test_helper'

class WeekTest < ActiveSupport::TestCase
  test 'starts on monday' do
    week = Week.new('2026-07-01') # a Wednesday
    assert_equal Date.new(2026, 6, 29), week.start
    assert_equal 7, week.dates.size
    assert_equal Date.new(2026, 7, 5), week.end_date
  end

  test 'defaults to the current week and survives bad input' do
    assert_equal Date.current.beginning_of_week, Week.new(nil).start
    assert_equal Date.current.beginning_of_week, Week.new('garbage').start
  end

  test 'labels relative weeks' do
    travel_to Date.new(2026, 7, 1) do
      assert_equal 'This week', Week.new('2026-07-01').label
      assert_equal 'Last week', Week.new('2026-06-24').label
      assert_equal 'Next week', Week.new('2026-07-08').label
      assert_equal 'Jun 1 - Jun 7', Week.new('2026-06-01').label
      assert_equal 'Jun 2, 2025 - Jun 8, 2025', Week.new('2025-06-02').label
    end
  end

  test 'navigation targets' do
    week = Week.new('2026-06-29')
    assert_equal Date.new(2026, 6, 22), week.prev_start
    assert_equal Date.new(2026, 7, 6), week.next_start
  end
end
