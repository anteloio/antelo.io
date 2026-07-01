class TimeEntry < ApplicationRecord
  belongs_to :user
  belongs_to :project

  validates :date, presence: true
  validates :hours, presence: true, numericality: { greater_than: 0 }
end
