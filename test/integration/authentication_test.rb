require 'test_helper'

class AuthenticationTest < ActionDispatch::IntegrationTest
  test 'timesheet and report require sign in' do
    get timesheet_path
    assert_redirected_to login_path

    get timesheet_report_path
    assert_redirected_to login_path
  end

  test 'google callback creates the user and signs in' do
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
      provider: 'google_oauth2',
      uid: '12345',
      info: {
        first_name: 'Flavio',
        last_name: 'Antelo',
        email: 'f@example.com',
        image: 'https://img.example/a.png'
      },
    )

    assert_difference 'User.count', 1 do
      get '/auth/google_oauth2'
      follow_redirect!
    end
    assert_redirected_to timesheet_path

    user = User.last
    assert_equal 'f@example.com', user.email
    assert_equal 'Flavio Antelo', user.name
    assert_equal '12345', user.uid

    get timesheet_path
    assert_response :success
  end

  test 'signing in twice reuses the same user' do
    user = create_user
    assert_no_difference 'User.count' do
      sign_in user
    end
  end

  test 'sign out clears the session' do
    sign_in create_user
    get sign_out_path
    assert_redirected_to login_path

    get timesheet_path
    assert_redirected_to login_path
  end

  test 'login page redirects signed in users to the timesheet' do
    sign_in create_user
    get login_path
    assert_redirected_to timesheet_path
  end
end
