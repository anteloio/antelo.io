---
title: "Kamal deploy says green. HTTPS is broken."
description: "The health check and SSL provisioning race on first deploy, and how to catch it before your users do."
publishedAt: 2026-06-20
---

There's one gotcha I hit every time I deploy a Rails app to a fresh server with Kamal: the deploy completes successfully, everything looks green, and HTTPS doesn't work.

Here's what's happening.

## The race

When you run `kamal deploy` for the first time on a new domain, two things happen in sequence:

1. The container starts and passes the health check
2. kamal-proxy begins provisioning a Let's Encrypt certificate via the ACME challenge

The health check is done via HTTP internally, directly to the container. It doesn't touch your domain, and it doesn't use HTTPS. So when the container responds 200, Kamal considers the deploy successful and exits cleanly.

Meanwhile, Let's Encrypt is still working in the background. The ACME challenge requires an HTTP request to your domain on port 80 to verify ownership before it can issue the cert. That takes time.

If you open `https://playlib.fr` right after the deploy, you'll either get a browser certificate error or a connection refused. The deploy output gave you no indication anything was wrong.

## Why it only happens once

On every subsequent deploy, the certificate is already provisioned and stored by kamal-proxy. The race only exists on the very first deploy to a domain Kamal has never seen before. New app, new subdomain, or a `kamal setup` on a fresh server — those are the moments to watch for.

## The fix

Deploy with `ssl: false` first, confirm the app is reachable over HTTP, then flip to `ssl: true` and redeploy.

```yaml
# config/deploy.yml
proxy:
  ssl: false  # first deploy
  host: playlib.fr
```

On the second deploy, kamal-proxy provisions the cert cleanly. No race — the container is already running and DNS is confirmed. Once HTTPS is live, Kamal handles renewal automatically.

If you deploy with `ssl: true` from the start and hit this, the cert will still provision on its own — it just takes a couple minutes. You can check with `curl -I https://playlib.fr` and wait for headers instead of an SSL error. But that leaves a window where users land on a broken site. The two-deploy approach closes that window entirely.
