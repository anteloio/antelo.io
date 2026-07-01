module ApplicationHelper
  # 8 -> "8", 7.5 -> "7.5" (mirrors the old fmtH)
  def fmt_hours(hours)
    hours % 1 == 0 ? hours.to_i.to_s : format('%.1f', hours)
  end

  # 1200 -> "$1,200", 1200.5 -> "$1,200.50" (mirrors the old fmtM)
  def fmt_money(value)
    precision = value % 1 == 0 ? 0 : 2
    number_to_currency(value, precision: precision)
  end

  def month_day(date)
    date.strftime('%b %-d')
  end

  def date_label(date)
    date.year == Date.current.year ? month_day(date) : date.strftime('%b %-d, %Y')
  end
end
