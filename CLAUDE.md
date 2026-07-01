# Agent instructions

When you need to write or edit content (blog posts, tweets, etc.), read `.mdless/_voice.md` first. That's the voice guide.

- Never use the em dash (—). It makes posts look like AI.
- If you must use a dash, use a small hyphen (-) instead.
- Better yet, avoid dashes completely. Write short, simple phrases instead. Split into two sentences when needed.
- Always use straight apostrophes and quotes (', ") in copy and code, never the curly/smart ones. Keeps it consistent with the codebase.

# Layout

- `rails/` is the app (Rails 8, Hotwire, SQLite, Kamal). Blog posts live in `rails/content/blog/*.md`, tweets in `rails/content/tweets/*.md`.
- `astro/` is the legacy app being replaced. Do not add features there.

# Dev server

`bin/dev` — runs the Rails app at http://localhost:4321 (port pinned for the Google OAuth callback). Production: https://antelo.io. Blog posts at `/blog/[slug]`.

# CI

`bin/ci` — rubocop + security audits + tests. Format Ruby with `bundle exec stree write <files>` (Syntax Tree, config in `rails/.streerc`).
