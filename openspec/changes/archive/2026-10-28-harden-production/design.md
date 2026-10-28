# Design

## Context

- Production runs `docker-compose.yml` with `RACK_ENV=development`; `bin/deploy` calls plain `docker compose`. Sinatra's default for `show_exceptions` is `development?`, so every unhandled error on mmdb.online renders the full exception page. `dump_errors` (default `!test?`) is what writes the backtrace to the log, and it is independent of the page.
- `config.ru` sets `session_secret` to `ENV['SESSION_SECRET']` with a hard-coded fallback. `JwtAuth` reads `ENV['JWT_SECRET']` on each call and never checks it.
- `config/environment.rb` runs `Dotenv.load`, which fills only variables that are not already set; a variable set to an empty string stays empty.
- `spec/support/test_env.rb` sets fixed secrets for RSpec and the browser-test server, but not `SESSION_SECRET`: the suite currently runs on the fallback.
- The Cloudflare tunnel (`mmdb-tunnel`, on the `mmdb_default` network) now targets `http://web:4666`, so production traffic no longer uses the host port.

## Goals / Non-Goals

**Goals:**
- Close the three exposures in specs/origin-security without changing how the app is run or deployed.

**Non-Goals:**
- Switching production to `RACK_ENV=production`. That would also turn off code reloading and query logging, and change the local database name fallback; it deserves its own change.
- A custom 500 page, or turning `ActiveRecord::RecordNotFound` into a 404. The default "Internal Server Error" body is enough to stop the leak.
- Checking secret length or strength. Rack's session cookie already rejects a session secret shorter than 64 bytes.

## Decisions

**Turn off `show_exceptions` explicitly in `config.ru`'s `configure` block.** One line, next to the existing `protection` settings, and it holds whatever `RACK_ENV` is. Rejected: switching production to `RACK_ENV=production` (see Non-Goals); `error` handlers per exception class (more code for the same result). Local development loses the in-browser exception page as well; the backtrace is still in the terminal through `dump_errors`.

**Check both secrets right after `Dotenv.load` in `config/environment.rb`, and `abort` naming the variable.** This runs before anything is served, covers every entry point (rackup, Puma, RSpec, the e2e server) and lets `.env` supply the values first. Blank counts as missing. The fallback in `config.ru` is then removed, because it can no longer be reached. Rejected: `ENV.fetch` at the point of use (`JwtAuth` would fail on the first login instead of at boot, and `fetch` accepts an empty string).

**Publish `127.0.0.1:4666:4666` rather than removing `ports:`.** The same `docker-compose.yml` is the documented local Docker setup (`DOCKER_DEPLOYMENT.md`, "available at http://localhost:4666"). Binding to loopback keeps that working and still closes the LAN, because the tunnel no longer uses the host port. Rejected: removing `ports:` (breaks local Docker use), or a compose override file (one more file for the server to drift on).

**Tests.**
- Error page: run the example with Sinatra's `environment` set to `:development` and assert `show_exceptions?` is false. Before the fix the default proc returns true, so it fails for the right reason. The request helper's app is built once in the test environment, without the exception middleware, so asserting a rendered page here would not prove anything.
- Secrets: spawn `ruby -e "require './config/environment'"` with each secret set to an empty string (so a local `.env` cannot fill it), and assert a non-zero exit and that the output names the variable. A third run with both set exits zero.
- Port: parse `docker-compose.yml` and assert the web service publishes only `127.0.0.1:4666:4666`.

## Risks / Trade-offs

- [The deploy restarts the app on a server whose `.env` lacks a secret, and the site goes down] → Checked before planning: production has `SESSION_SECRET` (65 characters) and `JWT_SECRET` (128 characters). `bin/deploy`'s health check would report the failure.
- [Someone runs `docker compose down` in `~/MMDb`, which removes `mmdb_default`, and the tunnel loses the app] → Unchanged by this change (the tunnel already depends on that network); `bin/deploy` only uses `up -d` and `restart`.
- [CI or the e2e server stops booting] → `spec/support/test_env.rb` gains a fixed `SESSION_SECRET` of at least 64 bytes; it is loaded before the app by both.

## Migration Plan

1. Merge and tag. The deploy sees `docker-compose.yml` change and runs `docker compose up -d --build`, which recreates the web container with the new port binding.
2. Verify: `https://mmdb.online/` loads; `https://mmdb.online/users/999999999` returns a 500 with no stack trace; from another machine, `http://192.168.40.63:4666/` is refused.
3. Rollback: tag the previous commit's tree as a new version. Nothing outside the repo changes, and the tunnel works with either port binding.
