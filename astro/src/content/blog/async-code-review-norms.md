---
title: "The async code review norms that help small teams ship"
description: "The specific rules and turnaround expectations I've seen work across consulting engagements."
draft: true
---

## The part most teams skip

- Teams adopt PR templates, add required reviewers, set up branch protection — then skip the one norm that actually matters: a maximum turnaround time
- Without it, PRs sit for a day or two while the author context-switches into something else
- Coming back to review feedback after context-switching costs 20-30 minutes of re-orientation per PR, every time
- The frustration isn't the feedback itself — it's the waiting. One HN thread on code review fatigue surfaced a commenter who resigned after 4 months. The reviews weren't wrong, they were just slow and unpredictable.

## The PR description that cuts review cycles in half

- Three questions every PR description must answer: what changed, why, and how to test it
- "What changed" prevents the reviewer from reverse-engineering intent from a diff
- "Why" is the most skipped — and the most valuable. A reviewer who understands the motivation can spot a better approach; one who doesn't will nitpick the implementation
- "How to test it" eliminates the review-round where the reviewer asks "did you test X"
- Style and naming feedback belongs to the linter, not the reviewer. If a linter can catch it, the reviewer shouldn't be spending attention on it

## The one norm worth enforcing: turnaround time

- 24 hours for a first look on any PR, regardless of size
- Same day for PRs under 200 lines
- "First look" means either an approval, a request for changes, or a comment saying "reviewing tomorrow" — silence is not a response
- This norm is not about being responsive, it's about making the cost of a PR predictable. Predictable cost changes how developers scope and sequence work.

## How to introduce it without a meeting

- Write a one-page doc: the two norms (description format + turnaround), the rationale, what you're asking people to try
- Send it to the tech lead first, not the whole team — get one ally before the group conversation
- Frame it as a two-week trial, not a policy change. "Try this for two sprints and we'll revisit" removes the finality that creates resistance
- The lightweight reminder that makes it stick: a Slack message in the PR thread after 24 hours — no shame, just a nudge. One person doing this consistently resets the team default.

<!--
## References

- Ask HN: I'm tired of intense code review cycles
  https://news.ycombinator.com/item?id=29600228
  61 points, 51 comments. Surface the commenter who resigned — concrete illustration of the morale cost. Also the Google standard ("approve if it definitely improves overall code health") as the framing for what good looks like.
-->
