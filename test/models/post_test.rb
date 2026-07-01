require 'test_helper'

class PostTest < ActiveSupport::TestCase
  test 'reads posts from content/blog' do
    assert Post.all.size >= 16
  end

  test 'published excludes drafts and sorts newest first' do
    published = Post.published
    assert published.any?
    assert published.none?(&:draft?)
    assert_equal published.map(&:published_at).sort.reverse, published.map(&:published_at)
  end

  test 'parses front matter' do
    post = Post.find('deploying-rails-with-kamal')
    assert_equal 'Zero-downtime Rails deploys on a single VM: Hetzner and Kamal', post.title
    assert post.description.present?
    assert_equal Date.new(2025, 4, 21), post.published_at
  end

  test 'renders markdown to html' do
    post = Post.find('deploying-rails-with-kamal')
    assert_includes post.html, '<h2>'
    assert_includes post.html, '<pre'
  end

  test 'find raises for drafts and unknown ids' do
    draft = Post.all.find(&:draft?)
    assert_raises(ActiveRecord::RecordNotFound) { Post.find(draft.id) } if draft
    assert_raises(ActiveRecord::RecordNotFound) { Post.find('nope') }
  end
end
