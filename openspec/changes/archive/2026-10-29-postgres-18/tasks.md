# Tasks

## 0. Branch

- [x] 0.1 Create `postgres-18` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. CI on PostgreSQL 18

- [x] 1.1 In `spec/dependency_updates_spec.rb`, add a failing example: `test.yml`'s `test` job has a `postgres` service whose image is `postgres:18`. Run it and see it fail on `postgres:11`.
- [x] 1.2 Change the service image to `postgres:18`, keeping the comment that it matches production. Verify 1.1 passes and actionlint is clean.

## 2. Password file for the web container

- [x] 2.1 Add a failing RSpec example: `docker-compose.yml`'s `web` service mounts `${PGPASS_FILE:-/dev/null}` at `/run/secrets/pgpass` read-only and sets `PGPASSFILE=/run/secrets/pgpass`. Run it and see it fail.
- [x] 2.2 Add the mount and the environment entry, with a one-line why comment. Verify 2.1 passes and `docker compose config` resolves the mount to `/dev/null` when `PGPASS_FILE` is unset.
- [x] 2.3 Show it working with this machine's Docker: run the web image with the mount pointed at a scratch password file and `DATABASE_URL` without a password against the local Postgres, and see it connect; then run it with no `PGPASS_FILE` and the usual URL, and see it connect as before.
- [x] 2.4 Document `PGPASS_FILE` in `.env.example` (commented out) and in `DOCKER_DEPLOYMENT.md`'s environment variables.

## 3. Verify

- [x] 3.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `postgres-18`, archive the change in the same PR and open it with `gh`; check the PR's `test` job passes on `postgres:18`. The owner merges right before the cutover.
- Cutover, as in design.md's Migration Plan, with the owner's approval for the `.env` edit; then verify, and keep the old server untouched as the rollback.
