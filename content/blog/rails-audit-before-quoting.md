---
title: "The 30-minute Rails audit I run before quoting any project"
description: "The diagnostic I use to scope work before touching a line of code."
draft: true
---

## Why I do this before quoting

- Most scope errors in freelance projects aren't about missing features — they're about hidden complexity that wasn't visible until you're already three weeks in
- A 30-minute audit doesn't catch everything. It catches the things that turn a 2-week engagement into a 6-week one.
- It also changes the client relationship. Walking in with findings — even small ones — signals that you work differently than the last consultant who said "sure, I can do that" without looking

## What I look for first: N+1 queries

- Run `bundle exec rails db:migrate` and check if the app even boots cleanly — tells you immediately about the state of the dev setup
- Add the `bullet` gem in development and run through the main user flows. Count the N+1 alerts.
- More than 5-10 N+1s in the first pass means the team hasn't been paying attention to query behavior — predict that any feature touching associations will have hidden performance cost
- Check `config/initializers/` for Bootsnap. Missing or misconfigured Bootsnap on a large app means boot time is a daily tax nobody's talked about
- These two things show up in roughly 80% of the codebases I've audited. They're not critical bugs — they're signals about what the team optimizes for

## Reading test coverage without running the suite

- `open coverage/index.html` if they have SimpleCov configured — gives you a coverage map in seconds
- Don't look at the percentage. Look at what's not covered: models with complex business logic, background jobs, anything touching payments or auth
- Low coverage on critical paths (< 60%) means changes carry hidden risk — budget more time for manual verification and regression testing
- No test suite at all is a different situation: either the app is very simple, or the team has been moving fast and technical debt is structural
- Coverage gaps predict where you'll find surprises, not where the bugs actually are

## Estimating effort from the schema and git log

- `bin/rails db:schema:dump` and look at the migration count and table structure: a schema with 80+ tables and no clear domain grouping means the app has grown without architectural refactoring
- `git log --oneline | wc -l` for commit volume; `git log --since="6 months ago" --oneline | wc -l` for recent activity — tells you if this is actively maintained or in caretaker mode
- `git log --all --oneline -- db/migrate/ | head -20` — recent migrations near the feature you're quoting mean the schema is still in motion, which adds risk
- Heuristic that's held across a dozen projects: every 10 tables in the domain you're touching adds roughly one day of ramp-up to account for unexpected associations and callbacks

## How to present the findings

- Don't send a report. Have a 20-minute call and walk through 3 things you found — the most important, one that's easy to fix, and one that affects your estimate
- Framing: "here's what I noticed before we scope the work" — not "here's what's wrong with your codebase"
- Non-technical clients don't need to understand N+1 queries. They need to understand "this part will take longer because of how the database is structured, and here's what that means for the timeline"
- Doing this builds trust before the project starts. A client who sees you did your homework before quoting will trust your mid-project judgment calls too

<!--
## References

No external references for this one — the audit process is personal and empirical. Consider linking to the Bullet gem and SimpleCov docs when writing the actual post.

- Bullet gem: https://github.com/flyerhzm/bullet
- SimpleCov: https://github.com/simplecov-ruby/simplecov
-->
