class User < ApplicationRecord
  has_many :projects, dependent: :destroy
  has_many :time_entries, dependent: :destroy
  has_many :locations, dependent: :destroy
  has_many :day_locations, dependent: :destroy

  def name
    [first_name, last_name].compact_blank.join(' ')
  end

  def update_dynamic_attributes(auth)
    self.first_name = auth.info.first_name
    self.last_name = auth.info.last_name
    self.email = auth.info.email
    self.avatar_url = auth.info.image if auth.info.image.present?
  end

  class << self
    def find_or_create_with_omniauth(auth)
      user = find_by(provider: auth.provider, uid: auth.uid) || initialize_from_omniauth(auth)
      user.update_dynamic_attributes(auth)
      user.save!
      user
    end

    def initialize_from_omniauth(auth)
      new do |user|
        user.provider = auth.provider
        user.uid = auth.uid
      end
    end
  end
end
