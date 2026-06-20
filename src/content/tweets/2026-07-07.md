Kamal tip: health check and SSL provisioning race on first deploy.

Your container can pass the health check before the cert is ready. Everything looks green. HTTPS is broken.

Verify SSL separately after the first deploy to a new domain.

Full breakdown: https://antelo.io/blog/kamal-in-production
