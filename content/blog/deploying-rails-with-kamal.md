---
title: "Zero-downtime Rails deploys on a single VM: Hetzner and Kamal"
description: "How to set up a Hetzner server and ship your first Rails deploy with Kamal."
publishedAt: 2025-04-21
---

## Create your server

I've been using Hetzner lately. It's great quality and cheap.

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
image: {your_project_name}

servers:
  web:
    - 192.168.0.1 # <-- USE YOUR IP HERE

registry:
  server: localhost:5555

...

builder:
  arch: amd64
  remote: ssh://root@192.168.0.1 # <-- ADD THIS LINE, AND USE YOUR IP
```

Note that the remote is not present in your deploy.yml by default. We're adding it to avoid painful compatibility issues, namely when you're working from anything other than Linux. This will use the remote server to build your app, ensuring it's perfectly compatible with its production env.

About the registry: since Kamal 2.12 (what Rails 8.1 ships), `server: localhost:5555` gives you a registry that Kamal runs itself. No Docker Hub account, no access token, no `KAMAL_REGISTRY_PASSWORD`. Kamal boots a registry container on your machine and the server pulls images through an SSH tunnel. One catch: your local Docker daemon has to be running, even with a remote builder, because that registry container runs locally.

On older Kamal, use Docker Hub instead:

```yaml
image: {your_docker_username}/{your_project_name}

registry:
  username: {your_docker_username}
  password:
    - KAMAL_REGISTRY_PASSWORD
```

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

After DNS propagates, that's it. A single server, deployed with two commands. Most Rails apps don't need more than this.

## Q&A

Questions that came up when I migrated this very site to this setup. I keep adding to this section as new ones show up.

### The localhost:5555 registry runs where? My machine or the server?

Your machine. The one where you type `kamal deploy`.

Kamal boots a small registry container locally and wires the production server to it through an SSH tunnel. That is why your local Docker daemon has to be running even when the build happens on the remote builder. I learned this the annoying way: my first setup failed with `failed to start containers: kamal-docker-registry` because Docker was stopped on my laptop.

It also means the image travels through your connection. With the remote builder from this post, the server builds the image, pushes it through the tunnel to your machine, then pulls it back. Sounds silly on paper. In practice, with layer caching, a deploy of this site takes about a minute.

### Is running the registry on my own machine a good idea?

For one person deploying one app to one VM: yes. It is the option with the least moving parts. No account, no access token to create and rotate, no storage quota, and your images never sit on someone else's infrastructure.

It stops being a good idea when your laptop stops being the center of your deploys. CI deploying on merge. A teammate who also ships. Images in the gigabytes. Hotel wifi. Any of those, move to a hosted registry.

### Why not GitHub Container Registry? It is free, right?

Free for public images. For private images the free plan gives you a small storage and transfer quota, and a Rails image eats it fast: every deploy the server pulls a few hundred MB, and that counts as transfer out.

That said, ghcr.io is a solid choice if your code already lives on GitHub and you want deploys that do not depend on your laptop:

```yaml
image: ghcr.io/{your_github_username}/{your_project_name}

registry:
  server: ghcr.io
  username: {your_github_username}
  password:
    - KAMAL_REGISTRY_PASSWORD # a personal access token with write:packages
```

The real difference between all these options is small. Local registry wins on zero setup. A hosted registry wins the moment deploys need to happen without you. Pick one and ship.
