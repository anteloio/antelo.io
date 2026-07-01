class DayLocation < ApplicationRecord
  belongs_to :user
  belongs_to :location

  validates :date, presence: true
end
