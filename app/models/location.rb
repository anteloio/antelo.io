class Location < ApplicationRecord
  belongs_to :user
  has_many :day_locations, dependent: :delete_all

  validates :name, presence: true

  scope :alphabetical, -> { order(:name) }
end
