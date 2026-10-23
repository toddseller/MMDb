# Design

## Context

See proposal.md for why and specs/plex-webhook for the required behavior. `webhooks_controller.rb` today does `JSON.parse(request.params['payload'])` when the field exists, else `JSON.parse(request.body.read)`. Checked locally with Rack 3.2.4 and rack-contrib 2.5.0:

- A multipart `payload` part with a filename becomes `{filename:, type:, name:, tempfile:, head:}`, the shape that raised the `TypeError` in production. A part without a filename stays a String (reproduced on the server, 204).
- `Rack::JSONBodyParser` reads the body into `rack.request.form_hash`, so `request.POST` already holds the parsed JSON, and rewinds only if the input responds to `rewind`. Production's input evidently does not, so the controller's second read got an empty string. `Rack::MockRequest` gives a rewindable `StringIO`, which is why the existing JSON example passed.
- `Rack::CommonLogger` (added by `rackup`) builds its line from `env['QUERY_STRING']` when the response body closes, after the app has run, so clearing the token from `QUERY_STRING` inside the stack keeps it out of the line.
- The app logs with `p`/`puts` to stdout, which `docker logs` collects.

## Goals / Non-Goals

**Goals:**
- Plex imports work again whichever form Plex uses.
- The next real webhook tells us which form Plex used.

**Non-Goals:**
- Changing what gets imported (`Show.plex_add`, `Movie.plex_add`).
- Finding out why Plex's form changed; the shape log answers that after deploy.

## Decisions

**1. One `plex_event` helper picks the source by shape.** In order: `payload` String → parse it; `payload` Hash with `:tempfile` → read and parse the file; otherwise a JSON request body → use `request.POST`, which `JSONBodyParser` has already parsed (never read the body again). `JSON::ParserError` or no source halts with 400. *Alternative:* re-reading the body with a rewind. Rejected: production's input can't rewind, and the parsed form is already there.

**2. One shape line per authenticated request, values never.** `puts "plex webhook: content_type=#{...} params=#{request.params.keys.sort} payload=#{text|file(<type>)|none}"`. Keys and classes only; `token` is no longer in `request.params` (decision 3). Written before parsing, so a 400 still records the shape. *Alternative:* log only failures. Rejected: we need to see the successful shape too, to learn what Plex sends now.

**3. A middleware moves `token` out of the query string for webhook paths.** `WebhookToken` in `config.ru`, `use`d before the app: for paths under `/v1/webhooks`, it parses `QUERY_STRING`, stores `token` in `env['mmdb.webhook_token']`, and rebuilds `QUERY_STRING` without it. The `before` filter compares against that env value. Because the logger reads `QUERY_STRING` after the app runs, the access line shows the path without the token, correct or not. *Alternatives:* turning off access logging (loses all request logs), or a path segment `/new/<token>` (logged the same way). Rejected.

**4. Tests send a body that reads once.** `spec/support/request.rb` gains a `once:` option that wraps the input in an object with `read` and no `rewind`, matching production. Multipart bodies are built by hand with and without a filename on the `payload` part, so both shapes are exercised exactly as Rack parses them.

## Risks / Trade-offs

- [Plex may use yet another shape] → it gets a 400, not a 500, and the shape line shows what arrived, so the next fix is targeted.
- [The shape log adds a line per Plex event, including playback events] → acceptable volume for a personal server; remove the line in a later change once Plex's form is known.
- [The secret still passes through Cloudflare, which terminates TLS] → unchanged from today; Cloudflare is trusted with all traffic already.
- [Logs from before this deploy still contain the token] → they live only in the current container's log; the deploy recreates the container (`up -d --build`), which discards them.

## Migration Plan

Deploy with `git pull --ff-only && docker compose up -d --build` on the server (the container is recreated, discarding old logs). The owner then triggers a Plex import; the shape line and a 204 confirm the fix. Rollback: revert the merge commit and redeploy the same way.
