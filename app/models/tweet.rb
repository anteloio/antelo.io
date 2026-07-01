# Tweets are markdown files in content/tweets, same shape as blog posts:
# the filename carries the intended date (YYYY-MM-DD-slug.md) and the body is
# the tweet text. Optional YAML front matter holds scheduledAt (to pin a time)
# and sentAt (stamped by "Mark as sent", which rewrites the file). State lives
# in git, so mark tweets as sent locally and commit.
class Tweet
  CONTENT_DIR = Rails.root.join('content/tweets')
  FRONT_MATTER = /\A---\s*\n(.*?)\n---\s*\n/m

  attr_reader :id, :text, :scheduled_at, :sent_at

  def initialize(id:, text:, scheduled_at:, sent_at:)
    @id = id
    @text = text
    @scheduled_at = scheduled_at
    @sent_at = sent_at
  end

  class << self
    def all
      CONTENT_DIR.glob('*.md').map { |path| from_file(path) }
    end

    def find(id)
      all.find { |tweet| tweet.id == id } or raise ActiveRecord::RecordNotFound, "no tweet with id #{id.inspect}"
    end

    def queued
      all.reject(&:sent?)
    end

    # Queued first (by scheduled time), then sent ones at the bottom (most recent first).
    def for_queue_page
      queued.sort_by(&:scheduled_at) + all.select(&:sent?).sort_by(&:sent_at).reverse
    end

    def from_file(path)
      raw = path.read
      meta = {}
      if (match = raw.match(FRONT_MATTER))
        meta = YAML.safe_load(match[1], permitted_classes: [Date, Time]) || {}
        raw = match.post_match
      end

      id = path.basename('.md').to_s
      new(
        id: id,
        text: raw.strip,
        scheduled_at: parse_time(meta['scheduledAt']) || date_from_filename(id),
        sent_at: parse_time(meta['sentAt']),
      )
    end

    private

    def parse_time(value)
      case value
      when Time
        value.in_time_zone
      when Date
        value.in_time_zone
      when String
        Time.zone.parse(value)
      end
    end

    def date_from_filename(id)
      match = id.match(/\A(\d{4}-\d{2}-\d{2})/)
      match ? Date.iso8601(match[1]).in_time_zone : Time.zone.at(0)
    end
  end

  def sent?
    sent_at.present?
  end

  def past_due?
    !sent? && scheduled_at < Time.current
  end

  # True when the schedule pins a specific time (front matter), not just a day.
  def timed?
    scheduled_at != scheduled_at.beginning_of_day
  end

  def character_count
    text.length
  end

  def intent_url
    "https://x.com/intent/tweet?text=#{ERB::Util.url_encode(text)}"
  end

  def mark_sent!(sent)
    write_file(sent_at: sent ? Time.current : nil)
  end

  private

  def path
    CONTENT_DIR.join("#{id}.md")
  end

  def write_file(sent_at:)
    meta = {}
    meta['scheduledAt'] = scheduled_at.strftime('%Y-%m-%dT%H:%M') if timed?
    meta['sentAt'] = sent_at.strftime('%Y-%m-%dT%H:%M:%S%z') if sent_at

    content = +''
    if meta.any?
      content << "---\n"
      meta.each { |key, value| content << "#{key}: #{value}\n" }
      content << "---\n\n"
    end
    content << text << "\n"
    path.write(content)
  end
end
