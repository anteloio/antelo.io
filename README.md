# antelo.io

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
bin/dev          # serves on http://localhost:4321 (pinned for Google OAuth)
```

Secrets: Google client id/secret live in `config/credentials.yml.enc`
(`bin/rails credentials:edit`, requires the gitignored `config/master.key`).

## Tests and CI

```bash
bin/ci           # rubocop, bundler-audit, importmap audit, brakeman, tests
```

## Deploy (Hetzner + Kamal)

Follows /blog/deploying-rails-with-kamal and /blog/deploying-to-one-vm.
The app runs on a single Hetzner VM with Kamal's built-in local registry
(no Docker Hub), remote amd64 builder and SQLite on the `antelo_storage`
volume:

```bash
bin/kamal deploy   # local Docker daemon must be running
```

Back up the SQLite files off the server (e.g. a daily cron to Hetzner
Object Storage).

## History

Until July 2026 this site was an Astro app deployed on Vercel with Turso
(see the git history before the Rails migration). `lib/tasks/legacy.rake`
holds the one-time importer that pulled the Turso data into SQLite.
