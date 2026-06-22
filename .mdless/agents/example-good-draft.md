---
title: "The background job that charged a card twice"
description: "How a job can succeed, retry, and double-charge a customer — with no exception raised and nothing in Sentry."
draft: true
---

## The failure mode in full

- Job runs, Stripe charges the card successfully
- Job raises an exception after the charge (`RecordInvalid`, Redis timeout, OOM kill)
- Processor sees no success confirmation, queues retry
- Retry runs, Stripe charges again
- No exception, no duplicate in the payments table — customer gets two charges and emails support

## Why the job processor can't know

- Job marked complete only when `perform` returns without error
- Everything before that error already happened in the real world
- No two-phase commit between the job queue and Stripe
- Processor retries with identical arguments, blind to what already ran

## The most dangerous code pattern

- External API call on line N, database write on line N+2
- Any exception between them leaves the external call done and the job as "failed"
- Show this pattern:

```ruby
charge = Stripe::Charge.create(...)          # real money moves
user.payments.create!(stripe_charge_id: ...) # job retries if this fails
```

- This is in most Rails codebases — nobody wrote it wrong on purpose

## The two questions every job must answer

- What happens if this runs twice?
- What happens if it fails halfway through?
- If either answer touches a customer, payment, or external account — the job isn't done
- These aren't edge cases: deploys, OOM kills, Redis blips, worker restarts all trigger retries

## Fix 1: idempotency keys

- Stripe deduplicates charges with a stable key within 24 hours
- Key must be derived from logical inputs (user ID + period, order ID) — not `SecureRandom.uuid` or `Time.now`
- Show the corrected pattern
- Note the 24-hour expiry and how to configure the retry window to stay within it

## Fix 2: check-before-act

- For APIs with no idempotency key support (email, webhooks)
- Guard: look up whether the work was already done before doing it
- Simplest form: a boolean column (`welcome_email_sent_at`, `webhook_delivered_at`)
- Guard goes first, before any external call
- Doesn't fully close the window — acceptable for low-stakes work (notifications, welcome emails)

## Fix 3: record intent before acting

- For anything that moves money, creates legal records, or sends documents
- `status` column: `pending` -> `sending` -> `sent`
- On retry, job sees `sending` or `sent` and returns early
- Status update must happen in the same transaction as the guard check — closes the TOCTOU race
- Address leftover `sending` state: reconciliation job or admin tool

## Which jobs actually need this

- Safe by default: jobs that only read, aggregate, or write to your own database
- Dangerous: jobs that cross into external systems with side effects
- Examples: payment processors, email (SendGrid, Postmark), SMS (Twilio), S3, outbound webhooks
- Heuristic: if reversing the side effect requires a human or a refund, it needs idempotency

## Testing it

- Run the job twice, assert the side effect happened once
- For Stripe: check only one charge on the test customer
- For email: check delivery count
- Write this test before shipping, not after the support ticket

<!--
## References

- Ask HN: How do you handle duplicate side effects when jobs, workflows retry?
  https://news.ycombinator.com/item?id=43208892
  Confirms the problem is widespread and unsolved — good for framing the post's opening. Comments show devs reinventing the same patterns independently.

- Stripe idempotency keys docs
  https://stripe.com/docs/api/idempotent_requests
  The authoritative source for Fix 1. Link directly in the post when showing the corrected Stripe pattern.

- Show HN: Verity - duplicate emails after job restarts
  https://useverity.io
  A product built to solve exactly this problem — proof the pain is real enough that someone productized it. Good supporting evidence, not a fix to recommend.

- Inngest - Developer platform for background jobs and workflows
  https://www.inngest.com
  Represents a different approach entirely — durable execution instead of idempotency guards. Worth a mention as "the nuclear option" if the job complexity warrants it.
-->

