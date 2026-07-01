class Project < ApplicationRecord
  belongs_to :user
  has_many :time_entries, dependent: :delete_all

  validates :name, presence: true

  scope :alphabetical, -> { order(:name) }
end
