# Audit All Content

Read all published posts, drafts, and the tweet queue. Identify improvements, apply them.

## Step 0 — Read the voice guide

```bash
cat .mdless/_voice.md
```

## Step 1 — Read all published posts

```bash
for f in rails/content/blog/*.md; do
  if ! grep -q "draft: true" "$f"; then echo "=== $f ==="; cat "$f"; echo; fi
done
```

## Step 2 — Read all drafts

```bash
for f in rails/content/blog/*.md; do
  if grep -q "draft: true" "$f"; then echo "=== $f ==="; cat "$f"; echo; fi
done
```

Audit each draft's outline across two dimensions:

**Depth** — are the outline points specific enough that a writer could start immediately? Vague bullet points ("explain rate limiting") should be replaced with concrete content descriptions ("the failure mode where X happens, and what to do about it"). Improve the outline if you can make it meaningfully more useful.

**Worth writing** — does the idea have a clear angle and audience fit? Delete the draft file entirely if the idea is weak, too generic, or a topic Flavio has nothing specific to add to.

## Step 3 — Read the tweet queue

```bash
for f in rails/content/tweets/*.md; do echo "=== $f ==="; cat "$f"; echo; done
```

Read the queue as a whole, not file by file in isolation. Note theme and tone across consecutive dates.

## Step 4 — Audit each post across three dimensions

**Title** — does it name the exact problem or insight, not just the topic?
- Weak: "Deploying Rails with Kamal"
- Strong: "Zero-downtime Rails deploys on a single VM with Kamal"

**Closing hook** — does the post end with something that lands? Not a generic CTA. A line that emerges from the post's own argument — an implication, a question, or a clean takeaway. The Claude Max post is the reference for tone: it ends with a principle or a engaging thought, not a plug.

**Consistency** — across the corpus: sentence case in headings, language tags on code blocks, no throat-clearing intros, no tone drift between posts.

## Step 5 — Audit each tweet across four dimensions

**Context** — does the reader get enough setup, or is it a fortune cookie? A punchy line needs a frame. If "now it waits" or similar needs three sentences of inference, add the missing beat.

**Frame** — is the stance honest and clear? Don't claim experience you don't have. "I'm still hourly but this keeps pulling me" beats "fixed pricing changed how I write code" if you haven't switched.

**Voice** — authority, not casual. Sentence case. First person. Short punchy lines. Dry humor welcome. No em dashes. Simple language over clever phrasing.

**Feed mix** — across the queue: don't stack several philosophical takes back to back. Break them up with practical ones (tool tips, code snippets, etc.). Flag or reorder mentally; edit wording if two adjacent tweets step on each other.

Length is a dial, not a rule. Tighten when it's padded. Expand when it's cryptic. Cut lines that add noise.

## Step 6 — Apply changes

**Posts:** edit only what genuinely improves the post. For titles, update both `title:` and `description:` if stale. For hooks, add or replace the final paragraph. For consistency, fix directly. Do not change the substance of a post.

**Tweets:** edit freely. Rewrite for context, frame, clarity, and length. Merge or split lines. Replace platitudes with concrete observations. If a tweet mentions a tool, library, company, or person without their Twitter/X handle, add it — only when confident, do not guess.

Delete the whole file if a tweet isn't worth keeping: platitude, wrong frame you can't fix, duplicate of another queued tweet, or weak filler that adds nothing to the feed. Removing a bad tweet is better than polishing one that shouldn't ship.

If a section, paragraph, or post adds noise without adding value — cut it. A shorter, tighter piece is better than a complete one.

## Step 7 — Report

```
blog-editor run — N posts reviewed, P updated — T tweets reviewed, Q updated, D deleted

blog/filename.md
  - title: "old" → "new"
  - added closing hook

blog/filename.md
  - no changes needed

tweets/2026-06-26.md
  - expanded: added context for deferred design debt
  - simplified line 3

tweets/2026-06-30.md
  - reframed: hourly practitioner → curious about fixed pricing

tweets/2026-07-02.md
  - deleted: platitude, nothing concrete to salvage
```

## Rules

- Do not delete published blog posts.
- Drafts: improve the outline or delete. Do not write the post.
- If a post is already strong, leave it alone.
- Do not commit. Stay on `main`.
