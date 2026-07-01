# Agent instructions

When you need to write or edit content (blog posts, tweets, etc.), read `.mdless/_voice.md` first. That's the voice guide.

- Never use the em dash (—). It makes posts look like AI.
- If you must use a dash, use a small hyphen (-) instead.
- Better yet, avoid dashes completely. Write short, simple phrases instead. Split into two sentences when needed.
- Always use straight apostrophes and quotes (', ") in copy and code, never the curly/smart ones. Keeps it consistent with the codebase.

# Layout

Rails 8 app (Hotwire, SQLite, Kamal to Hetzner). Blog posts live in `content/blog/*.md`, tweets in `content/tweets/*.md`. Both are read by PORO models (`Post`, `Tweet`); no content in the database.

# Dev server

`bin/dev` — runs at http://localhost:3000. Google sign-in locally requires http://localhost:3000/api/auth/callback/google among the OAuth client redirect URIs. Production: https://antelo.io. Blog posts at `/blog/[slug]`.

# CI and deploy

- `bin/ci` — rubocop + security audits + tests. Format Ruby with `bundle exec stree write <files>` (Syntax Tree, config in `.streerc`).
- `bin/kamal deploy` — deploys to the Hetzner VM. Needs the local Docker daemon running (Kamal's registry container runs locally).
