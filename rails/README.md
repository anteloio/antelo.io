# antelo.io (Rails)

Rails 8 app behind antelo.io: landing page, blog, tweet queue (`/x`) and the
timesheet (`/timesheet`).

## Stack

- Rails 8.1, Hotwire (Turbo + Stimulus), importmaps, no Node build.
- Tailwind CSS via tailwindcss-rails.
- SQLite in every environment. Database files live in `storage/`.
- Google sign-in with OmniAuth, no Devise
  (see /blog/google-sign-in-rails-without-devise).
- Blog posts and tweets are markdown files in `content/`, read by PORO models
  (`Post`, `Tweet`). No content in the database.
- Formatting: Syntax Tree (`bundle exec stree write ...`, config in `.streerc`),
  RuboCop aligned with it (see /blog/rails-auto-formatting-on-vscode).

## Run locally

```bash
bin/setup        # bundle + db:prepare
../bin/dev       # serves on http://localhost:4321 (pinned for Google OAuth)
```

Secrets: Google client id/secret live in `config/credentials.yml.enc`
(`bin/rails credentials:edit`, requires `config/master.key`).

## Tests and CI

```bash
bin/ci           # rubocop, bundler-audit, importmap audit, brakeman, tests
```

## Deploy (Hetzner + Kamal)

Follows /blog/deploying-rails-with-kamal and /blog/deploying-to-one-vm:

1. Create a Hetzner server (Ubuntu, CX22, public IPv4, your SSH key).
2. Put its IP in `config/deploy.yml` (`servers` and `builder.remote`).
3. Point DNS: A records for antelo.io and www.antelo.io to the server IP.
4. Export `KAMAL_REGISTRY_PASSWORD` (Docker Hub access token).
5. First time: `bin/kamal setup` with `proxy.ssl: false`. Once the app answers
   on http, flip `ssl: true` and `bin/kamal deploy` again (avoids the ACME
   race, see /blog/kamal-in-production).
6. After that, deploys are just `bin/kamal deploy`.

The SQLite files sit on the `antelo_storage` volume; back them up off the
server (e.g. a daily cron to Hetzner Object Storage).

## Importing the old data

One-time migration from the Turso database the Astro app used:

```bash
source ../.envrc   # TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
bin/rails legacy:import
```

To seed production, run the import locally and copy `storage/production.sqlite3`
up, or run the task inside the container with the env vars set.
