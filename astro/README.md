# antelo.io (legacy Astro app)

> This app is being replaced by the Rails app in `../rails`. Kept for
> reference until the Rails deploy is live; do not add features here.

Personal portfolio and blog. Built with [Astro](https://astro.build) and Tailwind CSS.

## Run locally

Requires Node 18+ and [pnpm](https://pnpm.io).

```bash
pnpm install     # install dependencies
pnpm dev         # start the dev server at http://localhost:4321
```

Other commands:

```bash
pnpm build       # build the static site into dist/
pnpm preview     # serve the built site locally to check the production output
```

## Project structure

- `src/pages/` — routes (`index.astro` is the landing page)
- `src/content/blog/` — blog posts as Markdown
- `src/layouts/` — shared page layout
- `public/` — static assets served as-is (avatar, project screenshots in `public/work/`)

## Deploy

Deployment is automatic through Vercel.

- Pushing to `main` triggers a production deploy to **antelo.io**.
- Every other branch and pull request gets its own Vercel preview URL.

No manual steps. Merge to `main` and the live site updates on its own.
