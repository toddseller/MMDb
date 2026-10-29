# Proposal

## Why

Production's database runs PostgreSQL 11.17 on Debian 10, both past end of life. A new Debian 13 container at 192.168.40.5 runs PostgreSQL 18.6, and a trial copy of `mmdb` there matched the old database row for row and served the app unchanged. Two things in the repository have to follow the move: CI tests against `postgres:11` because the `ci-test-gate` spec requires the same major version as production, and the web container can only get its database password from `DATABASE_URL` in `.env`. On the new server the app connects as `mmdb_app`, a login that owns only its own database, and its password is already in `~/.pgpass` on onyx; the app should read it from there instead of copying it into `.env`.

## What Changes

- CI's Postgres service becomes `postgres:18`, matching the new production server.
- `docker-compose.yml` mounts a password file into the web container and points libpq at it with `PGPASSFILE`. The host path comes from `PGPASS_FILE` in `.env` and defaults to `/dev/null`, so development and any setup without it work as before, with the password in `DATABASE_URL`.
- `.env.example` and `DOCKER_DEPLOYMENT.md` describe the option.
- The cutover itself (final dump and restore, `.env` change, restart) follows the merge as an operational step; the old server stays as the rollback.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `origin-security`: adds that the web container can take its database password from a password file named outside the repository, so `.env` need not hold it.

## Impact

- `.github/workflows/test.yml` (service image), `docker-compose.yml` (mount and env), `.env.example`, `DOCKER_DEPLOYMENT.md`.
- Specs: a new RSpec example reading `test.yml` and `docker-compose.yml`.
- Deploy: the compose change makes `bin/deploy` rebuild, which is harmless. The PR should merge right before the cutover, since CI runs on 18 from then on.
- No app code change. The trial showed the app, its schema and its queries work unchanged on 18.
