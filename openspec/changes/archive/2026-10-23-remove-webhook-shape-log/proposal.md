# Proposal

## Why

`fix-plex-webhook-payload` added a log line describing each Plex webhook's shape (content type, parameter names, payload kind) to learn which form Plex sends, after a webhook arrived as a file part and failed. Both Plex webhooks since the fix was deployed (2026-10-23, the first at 19:26) arrived the same way, as a multipart `payload` text field with a `thumb` image part, and was handled with a 204. The question is answered and the line only adds noise to the log; the parsing that accepts every form stays.

## What Changes

- The webhook no longer writes the `plex webhook:` shape line.
- Reading the event in any form, the 400 for an unreadable event, and keeping the secret out of logs are unchanged.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `plex-webhook`: removes the requirement "Each webhook request's shape is logged without values".

## Impact

- `app/controllers/webhooks_controller.rb` (the `log_plex_shape` helper and its call) and `spec/plex_webhook_spec.rb` (the shape-log examples).
- Production: deploy with `git pull --ff-only && docker compose restart web`; no gems or settings change.
