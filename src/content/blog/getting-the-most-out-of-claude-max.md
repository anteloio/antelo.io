---
title: "Getting the most out of your Claude Max plan"
description: "How I stopped slamming into the 5-hour usage cap — and trimmed a surprising amount of wasted compute along the way."
publishedAt: 2026-06-15
---

I've been living inside Claude Code for months now. It runs most of my day — agent loops that read code, write code, ship it, and report back. And for a while I had a recurring, slightly embarrassing problem: I kept hitting the rolling 5-hour usage limit on my Max plan, usually right in the middle of something I cared about.

The instinct most people have is *"upgrade the plan."* I've been doing this long enough to distrust that instinct. When you hit a wall, the wall is usually telling you something about *how* you're working, not about how much you're allowed to work. So before throwing money at it, I sat with the question: where is all this consumption actually going?

## The boring answer is usually the right one

Here's the thing nobody likes to hear — most of the tokens I was burning weren't doing useful work. They were overhead. Every time the agent ran `git status`, `git diff`, `ls -R`, a test run, a build log — the *entire* output got pulled into the context window and counted against me. A noisy `git diff` on a big change can be thousands of tokens of pure mechanical text, and the model doesn't need 95% of it to make a decision.

I didn't measure this first. I'll be honest — I *felt* it. After enough hours watching these loops run, you develop a gut sense for when an agent is "thinking" versus when it's just drowning in its own logs. The diff scrolls by and something in the back of your head goes *that's not where the value is.* Then I measured, and the gut was right: the overwhelming majority of my consumption was tool output, not reasoning.

## What I'm trying right now

I've been experimenting with a small Rust CLI proxy that sits between the agent and the shell — it intercepts commands like `git status` and `git diff` and returns a compressed, token-efficient version of the output instead of the raw firehose. The model still gets everything it needs to act; it just stops paying rent on whitespace and boilerplate.

I want to be careful here, because I'm still early with it and I distrust people who oversell their setups three days in. But the direction feels correct, and the numbers back it up: on routine dev operations I'm seeing 60–90% fewer tokens for the same work. That's not a rounding error. That's the difference between hitting the cap at hour three and never thinking about it again.

The part I didn't expect: it made the agent *better*, not just cheaper. A leaner context window means the model spends its attention on the actual problem instead of pattern-matching against three screens of log noise. Less in, more signal.

## The part that actually matters

There's a version of this post that's just "here's a tool, it saves tokens." But the lesson I keep relearning, across every product I've built, is this: **constraints are diagnostic.** The 5-hour limit wasn't my enemy. It was a smoke detector pointing at waste I'd stopped noticing because the plan was generous enough to hide it.

And there's a quieter upside. Every token that doesn't get processed is compute that doesn't get spent — GPUs that don't spin, energy that isn't drawn. At my scale that's a rounding error for the planet. At the scale of *everyone* running agent loops all day, it really isn't. Efficiency that happens to be greener is the easiest kind of green to commit to, because you'd do it anyway.

I'm not going to pretend I've got this fully figured out — I'll probably swap half this setup out in a month, because that's how it always goes. But the principle underneath it has held up for me for a long time: when something feels wasteful, it usually is. Trust that feeling, then go measure it.
