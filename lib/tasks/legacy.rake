require 'net/http'

# One-time import from the old Turso database (the Astro app's backend).
# Reads TURSO_DATABASE_URL and TURSO_AUTH_TOKEN from the environment (.envrc).
#
#   bin/rails legacy:import
#
# Idempotent: wipes and reloads the timesheet tables, matches users by email,
# and syncs tweet sent/scheduled state into content/tweets front matter.
namespace :legacy do
  desc 'Import users, timesheet data and tweet state from Turso'
  task import: :environment do
    turso = LegacyTurso.new(ENV.fetch('TURSO_DATABASE_URL'), ENV.fetch('TURSO_AUTH_TOKEN'))

    # --- Users: better-auth `user` + google uid from `account` -----------------
    uid_by_legacy_id =
      turso
        .query("select user_id, account_id from account where provider_id = 'google'")
        .to_h { |row| [row['user_id'], row['account_id']] }

    user_id_map = {}
    turso
      .query('select id, name, email, image from user')
      .each do |row|
        first_name, last_name = row['name'].to_s.split(' ', 2)
        user = User.find_or_initialize_by(email: row['email'])
        user.assign_attributes(
          first_name: first_name,
          last_name: last_name,
          avatar_url: row['image'],
          provider: 'google_oauth2',
          uid: uid_by_legacy_id[row['id']] || row['id'],
        )
        user.save!
        user_id_map[row['id']] = user.id
      end
    puts "users: #{user_id_map.size}"

    # --- Timesheet tables, preserving primary keys -----------------------------
    TimeEntry.delete_all
    DayLocation.delete_all
    Project.delete_all
    Location.delete_all

    turso
      .query('select id, user_id, name, hourly_rate from projects')
      .each do |row|
        Project.create!(
          id: row['id'],
          user_id: user_id_map.fetch(row['user_id']),
          name: row['name'],
          hourly_rate: row['hourly_rate'],
        )
      end
    puts "projects: #{Project.count}"

    turso
      .query('select id, user_id, project_id, date, hours from time_entries')
      .each do |row|
        TimeEntry.create!(
          id: row['id'],
          user_id: user_id_map.fetch(row['user_id']),
          project_id: row['project_id'],
          date: Date.iso8601(row['date']),
          hours: row['hours'],
        )
      end
    puts "time_entries: #{TimeEntry.count}"

    turso
      .query('select id, user_id, name from locations')
      .each { |row| Location.create!(id: row['id'], user_id: user_id_map.fetch(row['user_id']), name: row['name']) }
    puts "locations: #{Location.count}"

    turso
      .query('select id, user_id, date, location_id from day_locations')
      .each do |row|
        DayLocation.create!(
          id: row['id'],
          user_id: user_id_map.fetch(row['user_id']),
          date: Date.iso8601(row['date']),
          location_id: row['location_id'],
        )
      end
    puts "day_locations: #{DayLocation.count}"

    # --- Tweets: sync scheduled/sent state into content/tweets front matter ----
    files = Tweet.all
    imported = 0
    turso
      .query('select id, scheduled_at, text, sent_at from tweets')
      .each do |row|
        file = files.find { |tweet| tweet.text.strip == row['text'].to_s.strip }
        if file
          write_tweet_file(Tweet::CONTENT_DIR.join("#{file.id}.md"), row, row['text'])
        else
          date = row['scheduled_at'].to_s.first(10)
          write_tweet_file(Tweet::CONTENT_DIR.join("#{date}-legacy-#{row['id']}.md"), row, row['text'])
          imported += 1
        end
      end
    puts "tweets: #{Tweet.all.size} files (#{imported} new from the database)"
  end

  def write_tweet_file(path, row, text)
    meta = {}
    meta['scheduledAt'] = row['scheduled_at'] if row['scheduled_at'].to_s.length > 10
    meta['sentAt'] = row['sent_at'] if row['sent_at']

    content = +''
    if meta.any?
      content << "---\n"
      meta.each { |key, value| content << "#{key}: #{value}\n" }
      content << "---\n\n"
    end
    content << text.strip << "\n"
    path.write(content)
  end

  # Minimal client for Turso's HTTP pipeline API.
  class LegacyTurso
    def initialize(url, token)
      @uri = URI(url.sub(/\Alibsql:/, 'https:'))
      @token = token
    end

    def query(sql)
      response =
        Net::HTTP.post(
          URI("#{@uri}/v2/pipeline"),
          { requests: [{ type: 'execute', stmt: { sql: sql } }, { type: 'close' }] }.to_json,
          'Authorization' => "Bearer #{@token}",
          'Content-Type' => 'application/json',
        )
      raise "Turso query failed (#{response.code}): #{response.body}" unless response.code == '200'

      result = JSON.parse(response.body).dig('results', 0)
      raise "Turso query failed: #{result}" unless result['type'] == 'ok'

      cols = result.dig('response', 'result', 'cols').map { |col| col['name'] }
      result.dig('response', 'result', 'rows').map { |row| cols.zip(row.map { |cell| decode(cell) }).to_h }
    end

    private

    def decode(cell)
      case cell['type']
      when 'null'
        nil
      when 'integer'
        cell['value'].to_i
      when 'float'
        cell['value'].to_f
      else
        cell['value']
      end
    end
  end
end
