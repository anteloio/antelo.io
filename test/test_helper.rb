ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
require 'rails/test_help'

OmniAuth.config.test_mode = true

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    def create_user(email: 'user@example.com', uid: "google-uid-#{email}")
      User.create!(first_name: 'Test', last_name: 'User', email: email, provider: 'google_oauth2', uid: uid)
    end
  end
end

module ActionDispatch
  class IntegrationTest
    # Signs in through the real OmniAuth callback, with a mocked Google response.
    def sign_in(user)
      OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
        provider: 'google_oauth2',
        uid: user.uid,
        info: {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email
        },
      )
      get '/auth/google_oauth2'
      follow_redirect!
    end
  end
end
