# antelo.io

Personal site: portfolio, blog, tweet queue and a timesheet app.

Two apps live here during the migration to Rails:

- `rails/` - the Rails 8 app. This is the live codebase: landing page, blog,
  tweet queue and timesheet. SQLite locally and in production, deployed to a
  single Hetzner VM with Kamal.
- `astro/` - the legacy Astro app it replaces (was deployed on Vercel with
  Turso). Kept for reference until the Rails app is live, then it can be
  deleted.

Content is markdown, no database involved:

- Blog posts: `rails/content/blog/*.md`
- Tweets: `rails/content/tweets/*.md` (filename carries the date; front matter
  tracks `sentAt` when a tweet is marked as posted)

## Run locally

```bash
bin/dev          # Rails app at http://localhost:4321
astro/bin/dev    # legacy Astro app, same port
```

The port is pinned to 4321 because the Google OAuth client is registered with
`http://localhost:4321/api/auth/callback/google`.

## CI

```bash
bin/ci           # rubocop + security audits + tests, plus an Astro build check
```

## Deploy

See `rails/README.md`. Short version: Kamal to a Hetzner VM, SQLite on a
persistent volume, `bin/kamal deploy`.
