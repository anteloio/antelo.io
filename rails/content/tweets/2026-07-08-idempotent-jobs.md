Every background job should answer two questions:

What happens if this runs twice?
What happens if it fails halfway through?

If either answer is "bad things", you don't have a background job. You have a time bomb.

Write idempotent jobs. Safe to retry, safe to deploy into, safe to be wrong about.
