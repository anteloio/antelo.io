---
title: "Why I deploy to one VM and never regret it"
description: "Kamal + a single server beats Kubernetes for most Rails apps. Here's the threshold."
draft: true
---

## The real cost of Kubernetes isn't the invoice

- The k8s codebase has 580,000 lines of Go — that's what you're now operationally dependent on
- A 2019 security audit called its configuration "non-trivial" with confusing defaults and implicit security controls
- 37signals was paying $500k+/year for just RDS + Elasticsearch — before any compute
- The hidden cost: debugging distributed systems at 2am when logs are split across pods, networking is abstracted, and the issue might be a misconfigured YAML
- Opportunity cost: every hour spent on infra is an hour not spent on the product
- Three separate viral HN threads (719, 500, and 354 points) all say the same thing: you probably don't need Kubernetes. That's not contrarianism — it's developers who tried it and came back

## The stack I use every time

- Hetzner CX22 (2 vCPU, 4GB RAM) for small apps; CX32 (4 vCPU, 8GB RAM) for anything with real traffic
- Nuremberg datacenter for EU users — lowest latency in central Europe
- Kamal for zero-downtime deploys: rolling restarts, asset bridging, Let's Encrypt built in
- SQLite on the VM for most apps; Postgres via Neon when the app needs it
- Daily backups to Hetzner Object Storage — one cron job, automated
- solid_queue for background jobs — no Redis, no separate worker process to manage
- Everything in one `deploy.yml`. No Helm charts. No cluster state to reconcile.

## What Kamal actually does differently

- Treats servers like Capistrano treats code: imperative commands, not declarative state
- You say "deploy this" — it does it, you see it happen, it's done
- No reconciliation loop running in the background, no controller deciding what "desired state" means
- New server in the list: it gets provisioned with Docker automatically on next deploy
- Zero-downtime out of the box: health checks before traffic switches, old container stays up during rollout

## The honest thresholds

- A single CX32 handles thousands of daily active users for a typical Rails CRUD app without breaking a sweat
- What breaks first: CPU-bound work (video processing, heavy image transforms), not request volume
- Database bottleneck comes before server bottleneck for most apps — and that's solvable without adding servers
- You need more than one VM when: you need separate deploy cycles for app vs. worker, or your DB needs to scale independently, or you have regulatory requirements for redundancy
- Team size almost never drives the infrastructure decision — two engineers can run a single VM forever

## When to graduate

- First step up is never Kubernetes — it's a second VM for the DB, or a managed DB service
- Add a second app server only when p95 response time climbs under normal (not spike) traffic
- The migration path from one Kamal-managed VM to two is a config change, not a rewrite
- Kubernetes makes sense when you have platform engineers whose full-time job is infrastructure, or when you genuinely need per-service scaling at high concurrency (10,000+ concurrent users)
- If you're asking "do I need Kubernetes," the answer is no

<!--
## References

- "Let's use Kubernetes." Now you have eight problems
  https://pythonspeed.com/articles/dont-need-kubernetes/
  719 points on HN. Best single article on the concrete costs of k8s for small teams. Cites the 580k LOC stat and the security audit. Use for the "real cost" section.

- Maybe You Don't Need Kubernetes
  https://matthias-endler.de/2019/maybe-you-dont-need-kubernetes/
  500 points on HN. Covers simpler alternatives (Docker Compose, Nomad). Useful for the "when to graduate" framing.

- I Didn't Need Kubernetes, and You Probably Don't Either
  https://benhouston3d.com/blog/why-i-left-kubernetes-for-google-cloud-run
  354 points on HN. Personal war story — switched to Cloud Run. Good for the "I tried it and came back" angle.

- Why We're Leaving the Cloud (DHH / 37signals)
  https://world.hey.com/dhh/why-we-re-leaving-the-cloud-654b47e0
  285 points on HN. The $500k/year RDS + ES number comes from here. Use for the "invoice vs real cost" point. Note: 37signals is not a small team — adjust framing so it doesn't feel like an appeal to authority.

- Kamal deploy docs
  https://kamal-deploy.org/
  "Capistrano for containers" framing comes from here. Use to explain the imperative vs declarative distinction.
-->
