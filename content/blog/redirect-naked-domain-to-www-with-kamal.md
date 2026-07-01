---
title: "Redirect naked domain to www with Kamal"
description: "A quick recipe for redirecting your naked domain to the www subdomain when deploying Rails with Kamal."
publishedAt: 2025-05-18
---

You're using Rails and Kamal, and you want to redirect users from `touterrain.com`, for instance, to `www.touterrain.com`.

Here's a quick recipe explaining how to redirect your naked domain to the `www` subdomain.

## Step 1: Update your `deploy.yml`

First, you'll need to modify your Kamal deployment file, within config/deploy.yml. Head over to the `proxy` section and make sure it includes both versions of your domain:

```yaml
proxy:
  ssl: true
  hosts:
    - touterrain.com
    - www.touterrain.com
```

This tells Kamal to accept traffic for both the naked domain and the www subdomain.

You probably already have this setup, but just to make sure. Under the servers part you should have your server IP:

```yaml
servers:
  web:
    - 116.203.103.239
```

## Step 2: Set A records in your DNS provider

Now go to your domain provider (I use name.com, but it works similarly everywhere) and add two **A records**:

- One for the root: usually `@` or an empty entry
- One for `www`

Both should point to your server's IP. For example:

- `@` → A record pointing to `116.203.103.239`
- `www` → A record pointing to `116.203.103.239`

## Step 3: Add a redirect inside your Rails app

To make sure that anyone landing on the naked domain is redirected to `www`, add the following code to your `ApplicationController`:

```ruby
class ApplicationController < ActionController::Base
  before_action :redirect_to_www, if: -> { Rails.env.production? && request.subdomain != "www" }

  private

  def redirect_to_www
    redirect_to "https://www.touterrain.com" + request.fullpath, status: :moved_permanently, allow_other_host: true
  end
end
```

This ensures a 301 redirect from `touterrain.com` to `www.touterrain.com`, which is also relevant for SEO.

That's it. If you click on `touterrain.com`, you should always land on `www.touterrain.com`, and Google will be happy with the canonical URL.
