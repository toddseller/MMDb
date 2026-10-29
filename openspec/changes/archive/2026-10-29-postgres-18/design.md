# Design

## Context

`docker-compose.yml` is the production compose file and also the local development one: it mounts the repository at `/app`, reads `.env`, and runs as root in the `mmdb-web` image. The app connects with `DATABASE_URL` through the `pg` gem, which uses libpq, so libpq's standard `PGPASSFILE` works with no code change; libpq reads the password file only when the URL has no password. The trial copy ran exactly this way: `DATABASE_URL=postgres://mmdb_app@192.168.40.5:5432/mmdb`, `PGPASSFILE` pointing at a read-only mount of onyx's `~/.pgpass` (mode 600, owner `onyx`, readable by the container's root). CI's `ci-test-gate` spec already says tests run on production's major version, so its text needs no change; the workflow does.

## Goals / Non-Goals

**Goals:**
- CI on PostgreSQL 18.
- Production's database password lives only in `~/.pgpass` on onyx.

**Non-Goals:**
- Moving `tsr`, `crabazon` or `firs+aid` (later, one at a time).
- Making movie order stable for ties in `sorted_list` (found in the trial: two films with the same sort name and year swap places). It is a separate change.
- Docker secrets or another secret store; one file on one host doesn't need them.

## Decisions

- **Mount `${PGPASS_FILE:-/dev/null}` at `/run/secrets/pgpass`, read-only, and set `PGPASSFILE=/run/secrets/pgpass`.** With the default, the source is `/dev/null`, which always exists, so a machine without `PGPASS_FILE` gets an empty file instead of Docker creating a directory at a missing path. libpq only opens the file when the URL lacks a password, so development, whose URL has one, never reads it. Alternative: a production-only compose override file kept out of git. That would hide the production setup from the repository and from `bin/deploy`'s rebuild check.
- **`postgres:18`, not a minor-pinned tag.** CI follows the newest 18.x, as it follows the newest Ruby 3.4; production gets minor updates from PGDG's apt repository.
- **Test the configuration in RSpec,** as `spec/dependency_updates_spec.rb` already does for `test.yml`: the service image is `postgres:18`, and the compose file mounts the password file read-only with the `/dev/null` default and sets `PGPASSFILE`.

## Risks / Trade-offs

- [CI runs on 18 while production is still on 11, between the merge and the cutover] → Merge right before the cutover; the trial already showed the schema and app work on 18.
- [`db/structure.sql` dumped from 18 later won't load on 11] → Only matters for rollback to the old server, which uses its own data, not a fresh schema load.
- [`.pgpass` deleted or its permissions loosened on onyx] → libpq refuses a group- or world-readable file and the app fails to connect at boot, loudly; the cutover check catches it.

## Migration Plan

1. Merge this change and wait for master's tests.
2. Cutover: stop `mmdb-web-1`; dump the old `mmdb` and restore into the new one with the trial's commands; in `~/MMDb/.env` set `DATABASE_URL=postgres://mmdb_app@192.168.40.5:5432/mmdb` and `PGPASS_FILE=/home/onyx/.pgpass`; tag and deploy (the compose change rebuilds); verify the site, API, a sign-in, row counts and `current_user`.
3. Rollback: restore the old `DATABASE_URL` in `.env` and restart. The old server is untouched; anything written after the cutover would have to be copied back by hand.
