require 'test_helper'

class PublicPagesTest < ActionDispatch::IntegrationTest
  test 'home page renders' do
    get root_path
    assert_response :success
    assert_includes response.body, 'Flavio Antelo'
  end

  test 'blog index lists published posts only' do
    get posts_path
    assert_response :success
    assert_includes response.body, 'Zero-downtime Rails deploys'
    assert_not_includes response.body, Post.all.find(&:draft?)&.title.to_s if Post.all.any?(&:draft?)
  end

  test 'blog post renders markdown' do
    get post_path('deploying-rails-with-kamal')
    assert_response :success
    assert_includes response.body, '<h2>'
  end

  test 'unknown post 404s' do
    get post_path('nope')
    assert_response :not_found
  end

  test 'tweet queue renders and counts queued tweets' do
    get tweets_path
    assert_response :success
    assert_includes response.body, 'Tweet queue'
  end

  test 'marking a tweet sent requires sign in' do
    tweet = Tweet.all.first
    post toggle_sent_tweet_path(tweet.id, sent: 'true')
    assert_redirected_to login_path
  end
end
