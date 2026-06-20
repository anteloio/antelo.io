---
title: "SPACE Metrics for Engineering Teams"
description: "The SPACE productivity framework for engineering teams, broken down across five dimensions."
publishedAt: 2023-10-09
---

There are multiple frameworks for tracking and evaluating an engineering team's work. SPACE is one of the better ones.

I'll break it down letter by letter:

- S for Satisfaction (and well-being)
- P for Performance
- A for Activity
- C for Communication and Collaboration
- E for Efficiency (and flow)

## Satisfaction and Well-Being

**Satisfaction** is how fulfilled developers feel about the main aspects of their work, in terms of Work, Team, Tools, and Culture.

**Well-being** is about how healthy and happy they are.

A couple of questions you might ask your teams are:

**_"What is it that we're missing to make this job your dream job?"_**

- Break it down in terms of work, team, tools, and culture.

**_"From 1 to 4, how would you rate your energy level, and motivation?"_**

- The scale is from 1 to 4 because there is no middle point. This way, the respondent has to pick a side, whether positive or negative.

## Performance

Performance is best evaluated in terms of outcome (delivery, impact) instead of output (lines of code, pull requests, number of features).

Metrics to measure performance on delivery:

- Median time for code review
- Median time from WIP to production (if possible, segment it by category such as features, bugs, and technical debt)

Metrics to measure impact:

- Customer satisfaction (also known as NPS)
- Actual feature usage (not the delivery, but the usage)
- Profit per product (the ultimate business impact)

Note that, to improve delivery, it's common to compromise on quality.

To counterbalance, we can also track:

- Bugs backlog
- Bugs injection rate
- Ratio of incidents per code changes

## Activity

Activity is the raw output:

- Number of commits
- Number of pull requests
- Number of code reviews
- Number of comments per pull request*
- Number of total builds per pull request per dev**

_* Such an important yet overlooked metric._

_** Interesting to understand specific behavior and share best practices._

Attention! For an ever-lasting metric, do not use absolute values. Instead, calculate the ratio of activity per developer per unit of time.

## Communication and Collaboration

This metric captures how people work together:

- \# of comments per tech scoping
- \# of comments per pull request
- \# of messages on certain channels
- Network metrics about who is connected to whom and how
- Time to onboard new members

Note that, even though an overall number is already interesting to get an overview of how the company communicates, tracking these metrics on a per-developer basis is also relevant. This can help us recognize glue work, which is often mistakenly undervalued (mostly by ignorance of its existence).

## Efficiency and flow

Efficiency and flow represent the ability to complete work with minimal interruptions or delays.

Some possible metrics:

- Time to recompile after each code change
- The time it takes to reseed the local database
- \# of meets in the middle of the day

As a more generic and flexible approach, I love to ask:

- Perceived ability to stay in flow and deliver work

The latter can be asked in both forms at once, qualitative and quantitative, just like an NPS form. This way we have a reference number that we can use to spot detractors, but also an open text field for unstructured feedback, used to detect issues in our systems and processes.

## Conclusion

No matter what framework you use or metrics you decide to track, the most important metric will always be your team's perception of their work, i.e., do they feel productive? Are they motivated by their work? Do their teammates inspire them?

These are your ultimate metrics. Ask them!

Everything else can be used as a thermometer to start new investigations. But, eventually, you will need to talk to every and each one of your team members. Otherwise, you are sure to neglect and dangerously ignore crucial information to conduct a relevant leadership.

Use these as diagnostics, not scorecards. A number that looks bad is the start of a conversation, not the conclusion.
