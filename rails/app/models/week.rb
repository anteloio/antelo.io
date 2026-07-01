# A Monday-based week for the timesheet, resolved from an optional ?start=YYYY-MM-DD param.
class Week
  attr_reader :start

  def initialize(param = nil)
    date = param.present? ? Date.iso8601(param) : Date.current
    @start = date.beginning_of_week
  rescue Date::Error
    @start = Date.current.beginning_of_week
  end

  def dates
    (start..end_date).to_a
  end

  def end_date
    start + 6
  end

  def range
    start..end_date
  end

  def prev_start
    start - 7
  end

  def next_start
    start + 7
  end

  def this_start
    Date.current.beginning_of_week
  end

  def current?
    start == this_start
  end

  def label
    case offset
    when 0
      'This week'
    when -1
      'Last week'
    when 1
      'Next week'
    else
      "#{month_day_with_year(start)} - #{month_day_with_year(end_date)}"
    end
  end

  def month_day(date)
    date.strftime('%b %-d')
  end

  def month_day_with_year(date)
    date.year == Date.current.year ? month_day(date) : date.strftime('%b %-d, %Y')
  end

  private

  def offset
    ((start - this_start) / 7).to_i
  end
end
