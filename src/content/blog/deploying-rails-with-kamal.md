---
title: "Deploying Rails with Kamal"
description: "Notes to my future self on deploying a Rails app to a Hetzner server with Kamal, from creating the server to running the first deploy."
publishedAt: 2025-04-21
---

Writing this mostly for myself, but I hope it helps you too.

## Create your server

I've been using Hetzner lately. It's great quality, and super cheap.

In the web UI, I usually create a server with:

- Location: Nuremberg (or the one that is closest to your users)
- Image: Ubuntu (pick the latest version)
- Type: Shared vCPU
- Size: CX22 (the cheapest option)
- Networking: check "Public IPv4" and "Public IPv6"
- SSH keys: `cat ~/.ssh/id_ed25519.pub`
- Volumes: skip
- Firewalls: skip
- Backups: skip
- Placement groups: skip
- Labels: skip
- Cloud config: skip
- Name: appname-production

Then click "Create & Buy now".

You're redirected to the project page, where you can see the server IP.

Copy it and let's update our config/deploy.yml file on Rails.

## Update config/deploy.yml

```yaml
image: {your_docker_username}/{your_project_name}

servers:
  web:
    - 192.168.0.1 # <-- USE YOUR IP HERE

registry:
  username: {your_docker_username}

...

builder:
  arch: amd64
  remote: ssh://root@192.168.0.1 # <-- ADD THIS LINE, AND USE YOUR IP
```

Note that the remote is not present in your deploy.yml by default. We're adding it to avoid painful compatibility issues, namely when you're working from anything other than Linux. This will use the remote server to build your app, ensuring it's perfectly compatible with its production env.

Now you can setup the server: (this might take a few minutes)

```bash
kamal setup
```

## Set up DNS

If you're using something like name.com, add:

A Record:
- Host: appname.com
- Answer: IP address

CNAME Record:
- Host: www.appname.com
- Answer: appname.com

Note that DNS propagation can take a while.

## Deploy your app

When you're ready to deploy:

```bash
kamal deploy
```
