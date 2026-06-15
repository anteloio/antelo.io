---
title: "Getting the most out of your Claude Max plan"
description: "How I stopped slamming into the 5-hour usage cap, and trimmed a surprising amount of wasted compute along the way."
publishedAt: 2026-06-15
---

I've been living inside Claude Code for months now. It runs most of my day. Agent loops that read code, write code, ship it, and report back. And for a while I had a recurring, slightly embarrassing problem: I kept hitting the rolling 5-hour usage limit on my Max plan, usually right in the middle of something I cared about.

The instinct most people have is *"upgrade the plan."* But I'm already on the largest one. I pay €180 a month for the 20x Max plan, the top tier there is. There's nothing left to upgrade to. So that instinct was a dead end from the start, which honestly made it easier to ignore. I've been doing this long enough to distrust it anyway. When you hit a wall, the wall is usually telling you something about *how* you're working, not about how much you're allowed to work. So before throwing more money at it, I sat with the question: where is all this consumption actually going?

## The boring answer is usually the right one

Here's the thing nobody likes to hear. Most of the tokens I was burning weren't doing useful work. They were overhead. Every time the agent ran `git status`, `git diff`, `ls -R`, a test run, a build log, the *entire* output got pulled into the context window and counted against me. A noisy `git diff` on a big change can be thousands of tokens of pure mechanical text, and the model doesn't need 95% of it to make a decision.

I didn't measure this first. I'll be honest, I *felt* it. After enough hours watching these loops run, you develop a gut sense for when an agent is "thinking" versus when it's just drowning in its own logs. The diff scrolls by and something in the back of your head goes *that's not where the value is.* Then I measured, and the gut was right: the overwhelming majority of my consumption was tool output, not reasoning.

## What I'm trying right now

The tool I've been experimenting with is called **RTK (Rust Token Killer)**. It's a small CLI proxy, written in Rust, that sits between the agent and your shell. When Claude Code goes to run something like `git status`, `git diff`, `ps aux`, or a linter, RTK intercepts it, runs the real command, and hands back a compressed, token-efficient version of the output instead of the raw firehose. The model still gets everything it needs to make a decision. It just stops paying rent on whitespace, ANSI codes, and boilerplate it was going to skim past anyway.

### Setting it up

The setup is refreshingly low-ceremony, and the key idea is that **you don't change how you work**. The rewriting is transparent. On a Mac it's two commands:

```bash
brew install rtk     # install the binary
rtk init -g          # install the Claude Code hook + RTK.md globally
```

Then **restart Claude Code** so it picks up the hook. That hook is the part that makes RTK invisible: it intercepts outgoing Bash commands on the fly and rewrites them to their `rtk` equivalents before they run, so `git status` quietly becomes `rtk git status`. You write your commands normally; RTK does the interception with zero tokens of overhead on your side.

To confirm it's actually live:

```bash
rtk --version       # should print the version
rtk gain            # should print a savings report
```

One gotcha worth flagging, because it cost me a few confused minutes: there's a *different* tool also called `rtk` (a "Rust Type Kit"). If `rtk gain` errors out, you've probably got the wrong binary shadowing it. Check `which rtk`.

That's genuinely the whole setup. No config files to babysit, no per-project tuning. You install it, hook it in once, and then forget it exists, which for infrastructure is the highest compliment I can pay. The source and full command reference live at [github.com/rtk-ai/rtk](https://github.com/rtk-ai/rtk).

### What an afternoon looked like

I want to be careful here, because I'm still early with it and I distrust people who oversell their setups three days in. But the direction feels correct, and the numbers back it up. This is `rtk gain` after a single afternoon of normal work:

<div class="not-prose my-8 rounded-xl bg-[#0d1117] text-gray-200 text-[13px] leading-relaxed font-mono overflow-x-auto shadow-sm border border-gray-800">
  <div class="px-5 py-4">
    <div class="text-gray-100">RTK Token Savings <span class="text-gray-500">(Global Scope)</span></div>
    <div class="text-gray-700">════════════════════════════════════════════</div>
    <div class="mt-3 space-y-0.5">
      <div><span class="text-gray-500">Total commands:</span> <span class="text-gray-100">564</span></div>
      <div><span class="text-gray-500">Input tokens:</span>&nbsp;&nbsp;&nbsp;<span class="text-gray-100">201.4K</span></div>
      <div><span class="text-gray-500">Output tokens:</span>&nbsp;&nbsp;<span class="text-gray-100">67.0K</span></div>
      <div><span class="text-gray-500">Tokens saved:</span>&nbsp;&nbsp;&nbsp;<span class="text-emerald-400 font-semibold">134.8K (67.0%)</span></div>
      <div><span class="text-gray-500">Total exec time:</span> <span class="text-gray-100">7m25s</span> <span class="text-gray-600">(avg 790ms)</span></div>
      <div class="mt-1"><span class="text-gray-500">Efficiency:</span> <span class="text-emerald-400">████████████████</span><span class="text-gray-700">░░░░░░░░</span> <span class="text-emerald-400 font-semibold">67.0%</span></div>
    </div>
    <div class="mt-4 text-cyan-400">By Command</div>
    <div class="mt-2 space-y-0.5 text-gray-400">
      <div class="flex"><span class="w-6 text-gray-600">1.</span><span class="flex-1 text-cyan-300">rtk:toml ps aux</span><span class="w-16 text-right text-gray-200">61.4K</span><span class="w-16 text-right text-emerald-400">98.6%</span></div>
      <div class="flex"><span class="w-6 text-gray-600">2.</span><span class="flex-1 text-cyan-300">rtk git diff</span><span class="w-16 text-right text-gray-200">31.3K</span><span class="w-16 text-right text-emerald-400">46.5%</span></div>
      <div class="flex"><span class="w-6 text-gray-600">3.</span><span class="flex-1 text-cyan-300">rtk read</span><span class="w-16 text-right text-gray-200">8.7K</span><span class="w-16 text-right text-emerald-400">3.8%</span></div>
      <div class="flex"><span class="w-6 text-gray-600">4.</span><span class="flex-1 text-cyan-300">rtk diff</span><span class="w-16 text-right text-gray-200">2.8K</span><span class="w-16 text-right text-emerald-400">94.9%</span></div>
      <div class="flex"><span class="w-6 text-gray-600">5.</span><span class="flex-1 text-cyan-300">rtk git log --oneline…</span><span class="w-16 text-right text-gray-200">2.5K</span><span class="w-16 text-right text-emerald-400">71.3%</span></div>
      <div class="flex"><span class="w-6 text-gray-600">6.</span><span class="flex-1 text-cyan-300">rtk git commit</span><span class="w-16 text-right text-gray-200">2.2K</span><span class="w-16 text-right text-emerald-400">98.7%</span></div>
      <div class="flex"><span class="w-6 text-gray-600">7.</span><span class="flex-1 text-cyan-300">rtk lint eslint app/j…</span><span class="w-16 text-right text-gray-200">1.6K</span><span class="w-16 text-right text-emerald-400">95.8%</span></div>
    </div>
  </div>
</div>

Two-thirds of the tokens those 564 commands would have spent simply never got spent. And the distribution is telling: a single `ps aux` saved 61K tokens on its own, because 98.6% of that output was noise. `git diff` saved another 31K, and the linters came in north of 95% each. None of that was reasoning. All of it was firehose. That's not a rounding error. That's the difference between hitting the cap at hour three and never thinking about it again.

The part I didn't expect: it made the agent *better*, not just cheaper. A leaner context window means the model spends its attention on the actual problem instead of pattern-matching against three screens of log noise. Less in, more signal.

## The part that actually matters

There's a version of this post that's just "here's a tool, it saves tokens." But the lesson I keep relearning, across every product I've built, is this: **constraints are diagnostic.** The 5-hour limit wasn't my enemy. It was a smoke detector pointing at waste I'd stopped noticing because the plan was generous enough to hide it.

And there's a quieter upside. Every token that doesn't get processed is compute that doesn't get spent. GPUs that don't spin, energy that isn't drawn. At my scale that's a rounding error for the planet. At the scale of *everyone* running agent loops all day, it really isn't. Efficiency that happens to be greener is the easiest kind of green to commit to, because you'd do it anyway.

I'm not going to pretend I've got this fully figured out. I'll probably swap half this setup out in a month, because that's how it always goes. But the principle underneath it has held up for me for a long time: when something feels wasteful, it usually is. Trust that feeling, then go measure it.

RTK is just my current answer. The real question is yours: how are you keeping your agent loops lean? If you've found something that works, I want to hear it.
