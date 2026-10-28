# Proposal

## Why

A security audit found three ways the production server gives away more than it should. Any error page on mmdb.online shows a full Ruby stack trace, because production runs with `RACK_ENV=development`. If `SESSION_SECRET` is ever missing, the app quietly signs session cookies with a secret that is public on GitHub, and a blank `JWT_SECRET` is not caught either. And the app listens on port 4666 on every network interface, so anything on the home network can reach it without going through Cloudflare. The tunnel now reaches the app by container name (`http://web:4666`), so the host port is no longer needed for production traffic.

## What Changes

- Unexpected errors return a plain "Internal Server Error" page in every environment the server runs in. The stack trace still goes to the server log.
- The app refuses to start when `SESSION_SECRET` or `JWT_SECRET` is missing or blank, and names the missing variable. The hard-coded fallback session secret is removed.
- `docker-compose.yml` publishes port 4666 on the loopback address only (`127.0.0.1:4666:4666`). Local Docker use keeps `http://localhost:4666`, and other machines on the network can no longer connect.
- The test environment sets its own `SESSION_SECRET`, as it already does for `JWT_SECRET`.

## Capabilities

### New Capabilities
- `origin-security`: what the production server reveals to visitors and who can reach it: error pages without internals, required signing secrets, and a web port reachable only through the tunnel.

### Modified Capabilities

None.

## Impact

- `config.ru`: the error-page setting, and removal of the fallback session secret.
- `config/environment.rb`: the startup check for the two secrets.
- `docker-compose.yml`: the published port. Because a compose file changes, the deploy rebuilds the web container instead of restarting it.
- `spec/support/test_env.rb`: a test `SESSION_SECRET`.
- Production: the server's `.env` already sets both secrets (checked: 65 and 128 characters), and the tunnel already points at `http://web:4666`, so the deploy needs no manual steps.
- Out of scope, from the same audit: owner checks on `/api/v2` and `/api/v3`, login rate limiting, session and password rules, and security headers. `docker-compose.production.yml` is not used by the deploy and is left alone.
