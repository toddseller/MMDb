# Proposal

## Why

Plex imports stopped working on 2026-10-23. Plex's first webhook after `secure-api-tokens-and-webhook` passed the new secret check and then failed with a 500 (`TypeError: no implicit conversion of Hash into String` at `webhooks_controller.rb:14`): its `payload` field arrived as an uploaded-file Hash, while the code only handles a plain string. A webhook with a JSON body also fails with a 500, because `Rack::JSONBodyParser` has already consumed the body by the time the controller reads it. And the webhook secret is written into the container's access log as part of the request URL. Why Plex's payload shape differs from before is not known; nothing in the parsing code or its gems changed, so the fix accepts every shape and records which one arrives.

## What Changes

- The webhook reads the Plex event from whichever form it arrives in: a `payload` text field, a `payload` file part, or a JSON request body.
- A request whose event can't be read (missing or invalid JSON) is answered with a 400 instead of a 500, and nothing is imported.
- Each authenticated webhook request writes one log line describing its shape: the request content type, the parameter names, and for `payload` its kind and part content type. Values, the event contents and the secret are never logged.
- The webhook secret is removed from the request before logging, so access logs show `/v1/webhooks/new` without `?token=`.
- The webhook specs send bodies that can be read only once, as in production, so a body-handling bug can't pass the tests again.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `plex-webhook`: adds requirements for accepting every payload form, rejecting unreadable events with a 400, logging each request's shape without values, and keeping the secret out of logs. The existing requirements are unchanged.

## Impact

- `app/controllers/webhooks_controller.rb` (event parsing, shape logging, reading the secret), a small Rack middleware that moves `token` out of the query string for webhook paths, `config.ru` (uses it), `spec/plex_webhook_spec.rb` (new cases), `spec/support/request.rb` (a non-rewindable request body).
- Production: deployed with `git pull --ff-only && docker compose up -d --build`; no new settings. After the deploy the owner triggers a Plex import and the log line shows which shape Plex sends.
