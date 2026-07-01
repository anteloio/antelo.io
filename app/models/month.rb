# A calendar month for the report page, resolved from an optional ?month=YYYY-MM param.
class Month
  attr_reader :first

  def initialize(param = nil)
    @first =
      if param.present? && param.match?(/\A\d{4}-\d{2}\z/)
        Date.new(*param.split('-').map(&:to_i), 1)
      else
        Date.current.beginning_of_month
      end
  rescue Date::Error
    @first = Date.current.beginning_of_month
  end

  def last
    first.end_of_month
  end

  def range
    first..last
  end

  def key
    first.strftime('%Y-%m')
  end

  def prev_key
    (first << 1).strftime('%Y-%m')
  end

  def next_key
    (first >> 1).strftime('%Y-%m')
  end

  def current?
    first == Date.current.beginning_of_month
  end

  def label_full
    first.strftime('%B %Y')
  end

  def label
    case offset
    when 0
      'This month'
    when -1
      'Last month'
    when 1
      'Next month'
    else
      label_full
    end
  end

  private

  def offset
    (first.year - Date.current.year) * 12 + (first.month - Date.current.month)
  end
end
