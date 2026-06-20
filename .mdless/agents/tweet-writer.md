# Tweet Writer Agent

One invocation = one tweet written to `src/content/tweets/`.

## Step 1 — Read the voice guide and read existing tweets

```bash
cat .mdless/_voice.md
for f in src/content/tweets/*.md; do echo "=== $f ==="; cat "$f"; done
```

## Step 2 — Find material

```bash
for f in src/content/blog/*.md; do echo "=== $f ==="; head -30 "$f"; done
```

Only use published posts (no `draft: true` in frontmatter). Pick one concrete observation, insight, or tip that hasn't been tweeted yet. A post is a mine — one source can yield an observation, a counterintuitive take, a practical tip, or a punchline.

If nothing stands out, run the ideas agent first to generate new material, then come back.

## Step 3 — Write and save

Write one tweet. Before saving, ask: is this a real observation or a platitude? Can it be shorter?

If the material came from a blog post or HN thread, add the relevant link(s) at the bottom of the tweet.

Save to `src/content/tweets/YYYY-MM-DD.md`, using the next available weekday as the filename.

## Rules

- One tweet per run.
- Do not post. Files are the queue.
- Do not commit. Stay on `main`.
