require 'test_helper'

class MonthTest < ActiveSupport::TestCase
  test 'parses YYYY-MM and exposes the range' do
    month = Month.new('2026-02')
    assert_equal Date.new(2026, 2, 1), month.first
    assert_equal Date.new(2026, 2, 28), month.last
  end

  test 'defaults to the current month and survives bad input' do
    assert_equal Date.current.beginning_of_month, Month.new(nil).first
    assert_equal Date.current.beginning_of_month, Month.new('2026-2').first
  end

  test 'labels relative months' do
    travel_to Date.new(2026, 7, 15) do
      assert_equal 'This month', Month.new('2026-07').label
      assert_equal 'Last month', Month.new('2026-06').label
      assert_equal 'Next month', Month.new('2026-08').label
      assert_equal 'January 2026', Month.new('2026-01').label
    end
  end

  test 'prev and next keys cross year boundaries' do
    month = Month.new('2026-01')
    assert_equal '2025-12', month.prev_key
    assert_equal '2026-02', month.next_key
  end
end
