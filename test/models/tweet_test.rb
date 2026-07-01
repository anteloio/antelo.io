require 'test_helper'

class TweetTest < ActiveSupport::TestCase
  FIXTURE = Tweet::CONTENT_DIR.join('2026-01-05-test-fixture-tweet.md')

  teardown { FIXTURE.delete if FIXTURE.exist? }

  test 'reads tweets from content/tweets, date from the filename' do
    tweet = Tweet.all.find { |t| t.id == '2026-07-03-single-vm-kamal' }
    assert tweet
    assert_equal Date.new(2026, 7, 3), tweet.scheduled_at.to_date
    assert_not tweet.timed?
    assert_includes tweet.text, 'Hetzner'
  end

  test 'front matter overrides schedule and marks sent' do
    FIXTURE.write(<<~MD)
      ---
      scheduledAt: 2026-01-05T19:07
      sentAt: 2026-01-06T09:00:00+01:00
      ---

      Hello world
    MD
    tweet = Tweet.find('2026-01-05-test-fixture-tweet')
    assert tweet.sent?
    assert tweet.timed?
    assert_equal 'Hello world', tweet.text
    assert_equal Time.zone.parse('2026-01-05T19:07'), tweet.scheduled_at
  end

  test 'mark_sent! rewrites the file preserving the text' do
    FIXTURE.write("Hello world\n")
    tweet = Tweet.find('2026-01-05-test-fixture-tweet')
    assert_not tweet.sent?

    tweet.mark_sent!(true)
    reloaded = Tweet.find('2026-01-05-test-fixture-tweet')
    assert reloaded.sent?
    assert_equal 'Hello world', reloaded.text

    reloaded.mark_sent!(false)
    assert_not Tweet.find('2026-01-05-test-fixture-tweet').sent?
    assert_equal "Hello world\n", FIXTURE.read
  end

  test 'queue page ordering puts queued first, sent last' do
    FIXTURE.write("---\nsentAt: 2026-01-06T09:00:00+01:00\n---\n\nAlready sent\n")

    ordered = Tweet.for_queue_page
    sent_start = ordered.index(&:sent?)
    assert_not_nil sent_start
    assert ordered[0...sent_start].none?(&:sent?), 'queued tweets must come before sent ones'
    assert ordered[sent_start..].all?(&:sent?), 'sent tweets must be grouped at the bottom'
  end
end
