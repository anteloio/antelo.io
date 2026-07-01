# Blog posts are markdown files in content/blog, same format the Astro app used:
# YAML front matter (title, description, publishedAt, draft) followed by the body.
class Post
  CONTENT_DIR = Rails.root.join('content/blog')
  FRONT_MATTER = /\A---\s*\n(.*?)\n---\s*\n(.*)\z/m

  attr_reader :id, :title, :description, :published_at, :body

  def initialize(id:, title:, description:, published_at:, draft:, body:)
    @id = id
    @title = title
    @description = description
    @published_at = published_at
    @draft = draft
    @body = body
  end

  class << self
    def all
      # Cache across requests in production; reload from disk in dev and test.
      return load_all unless Rails.env.production?

      @all ||= load_all
    end

    def published
      all.select(&:published?).sort_by(&:published_at).reverse
    end

    def find(id)
      published.find { |post| post.id == id } or
        raise ActiveRecord::RecordNotFound, "no published post with id #{id.inspect}"
    end

    private

    def load_all
      CONTENT_DIR.glob('*.md').map { |path| from_file(path) }
    end

    def from_file(path)
      raw = path.read
      meta_yaml, body = raw.match(FRONT_MATTER)&.captures
      raise ArgumentError, "missing front matter in #{path}" unless meta_yaml

      meta = YAML.safe_load(meta_yaml, permitted_classes: [Date])
      new(
        id: path.basename('.md').to_s,
        title: meta['title'],
        description: meta['description'],
        published_at: meta['publishedAt'],
        draft: meta.fetch('draft', false),
        body: body,
      )
    end
  end

  def published?
    !draft? && published_at.present?
  end

  def draft?
    @draft
  end

  def html
    @html ||=
      Commonmarker.to_html(
        body,
        options: {
          render: {
            unsafe: true
          },
          extension: {
            table: true,
            strikethrough: true,
            autolink: true
          }
        },
        plugins: {
          syntax_highlighter: {
            theme: 'InspiredGitHub'
          }
        },
      ).html_safe
  end
end
