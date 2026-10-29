# Proposal

## Why

The report-only Content-Security-Policy has logged `script-src-elem` reports on `/`, `/users/1` and `/users/1/shows` for `https://static.cloudflareinsights.com/beacon.min.js`, the Cloudflare Web Analytics script Cloudflare injects into pages for real browsers. The owner uses those analytics, so an enforced policy must allow the script rather than block it.

## What Changes

- `script-src` adds `https://static.cloudflareinsights.com`, where the beacon is loaded from. It arrives as a plain `<script src>`, so no inline allowance is needed.
- `connect-src` adds `https://cloudflareinsights.com`, where the beacon can send its measurements; with Cloudflare's automatic setup it may post to the site's own `/cdn-cgi/rum` instead, which `'self'` already covers.
- Nothing else changes, and the policy stays report-only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `origin-security`: the report-only policy also allows Cloudflare Web Analytics' script host and its reporting host.

## Impact

- `app/controllers/content_security_policy.rb` (two directives), `spec/content_security_policy_spec.rb`.
- After deploying, the `cloudflareinsights.com` reports stop; a `connect-src` report, if one appears, names the host the beacon really uses.
