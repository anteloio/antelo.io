# New Blog Draft

One invocation = one draft file in `content/blog/`. Quality over quantity.

## Goals

Every post must serve at least one:
1. **Attract clients.** A CTO, tech lead, or maker/founder finishes reading and thinks "I want to work with this person."
2. **Build authority.** A peer finishes reading and thinks "this person knows this deeply."

## Domain

Tech stack: Rails, React/TypeScript, Kamal, Heroku, Postgres, SQLite.
Topics: AI automations, AI tooling, agent systems, Maker tools, Engineering productivity, Freelance consulting.

## Step 1 — Check what's already covered

```bash
for f in content/blog/*.md; do echo "$f:"; head -4 "$f"; echo; done
```

## Step 2 — Find one strong idea

Search for a genuine gap — a question developers keep asking with no good answer, or a topic where existing posts are shallow.

Use WebFetch to search the Algolia HN API for Flavio's topics (see `.mdless/_voice.md`). One query per topic, using `tags=story` to filter to posts only. Example:

`https://hn.algolia.com/api/v1/search?query=rails&tags=story&hitsPerPage=20`

Each hit has `title`, `url`, `points`, `num_comments`, `created_at`. Sort by points, prioritize recent. Look for threads where people ask the same question repeatedly, or where answers are shallow — that's the gap.

A good idea: relevant to Flavio's audience (small to medium companies hiring freelancers, makers and builders), written from direct experience, specific enough that the title alone signals expertise. Covering a topic that exists elsewhere is fine — what matters is Flavio's angle, not novelty.

## Step 3 — Write a detailed outline

Be exhaustive. Each point must describe the **actual content**: what argument is made, what example is shown, what the reader learns. Not headings.

Bad: "How to handle background jobs in Rails"
Good: "Why a background job can charge a card twice, return no error, and you only find out from a customer complaint. The idempotency check that prevents it."

Cover everything the post could say. The editor will decide what to keep. Detailed enough that a writer could start immediately.

At the end, include a **Sources** section with links to relevant HN threads, blog posts, or docs found during research. The writer will use these when filling in the post.

## Step 4 — Create the draft

Use `.mdless/agents/example-good-draft.md` as a reference for format and quality. Write to `content/blog/<slug>.md` and print the file.

## Rules

- One draft per run. Field reports only, no surveys, no listicles.
- Size follows the idea. A single insight that becomes a tweet is fine. A long-form deep dive is equally fine. Pick whatever serves the material best.
- Do not commit. Stay on `main`.
