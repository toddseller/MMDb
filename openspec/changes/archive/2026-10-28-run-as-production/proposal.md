# Proposal

## Why

Production still runs as `RACK_ENV=development`. The last change turned off Sinatra's error page, but Puma has its own: when an error escapes the whole app, Puma in development answers with the full stack trace. A malformed `%` escape in any `/v1/webhooks` URL does exactly that today, because the `WebhookToken` middleware parses the query string before Sinatra sees it. Development mode also does work production doesn't need: code reloading, every SQL query in the logs, and rackup's Rack spec checker.

## What Changes

- The server runs as `RACK_ENV=production`. `docker-compose.yml` takes `RACK_ENV` from the project's `.env`, falling back to `development`, so local Docker use is unchanged. The server's `.env` is switched to `production`.
- A `/v1/webhooks` request with a malformed query string gets a 400, like every other route already does, instead of crashing in the middleware.
- `config/puma.rb` no longer redirects output to log files in production, so the logs stay in `docker logs`.
- `config.ru` adds `Rack::TempfileReaper`, which rackup adds only in development, so upload temp files are still removed after each request.
- Comments that say production runs as development are corrected.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `origin-security`: the error-page requirement also covers errors that escape the app, which Puma answered with a stack trace.
- `plex-webhook`: a request whose query string can't be parsed is answered with a 400.

## Impact

- `docker-compose.yml`, `config/puma.rb`, `config.ru`, `app/helpers/session_helper.rb` (comment only).
- Production: one manual edit to the server's `.env` (`RACK_ENV=production`) before the deploy. The compose change makes the deploy rebuild and recreate the web container.
- Log output changes: no SQL queries, and Sinatra's request logger replaces rackup's (same line format). Backtraces of unexpected errors are still logged.
- Unaffected: the test suites (they force `test`), `bin/deploy`, the database settings and the tunnel. `PUMA_THREADS=1` and `WEB_CONCURRENCY=0` are set in the server's `.env` and keep the server single-threaded in single mode; whether 1 thread is right is a separate question.
