# Design

## Context

- **Today's order** (`bin/deploy:46-58`):
  1. `docker compose exec -T web bundle exec rake db:migrate < /dev/null` in the running container;
  2. then `docker compose up -d --build` when `git diff --name-only old new` names `Gemfile`, `Gemfile.lock`, a `Dockerfile` or a compose file, and `docker compose restart web` otherwise.
- **Why step 1 breaks on a gem change:** the compose file mounts the checkout at `/app`, so the running container reads the new `Gemfile.lock` as soon as `master` moves. Its gems are installed in the image (`/usr/local/bundle`, outside the mount), and they are the old ones. `bundle exec` checks the whole lockfile, so even a `rake` with nothing to migrate fails with `Bundler::GemNotFound`.
- **Why a retry can't recover:** after the first attempt, the server is already on the tag, so `old == new`, the diff is empty, and the script picks `restart`. Seen on v2026.11.06.0: attempt 2 failed the same way; attempt 3 passed only after a manual rebuild, and logged "Code only: restart".
- **The image:** `COPY Gemfile*` then `RUN bundle install`, then `COPY . /app`. A build with an unchanged Gemfile reuses every layer up to `bundle install`.
- **Tests:** `spec/deploy_script_spec.rb` runs the real script against throwaway git repositories with `docker` and `curl` replaced by recorders, and asserts the exact `docker` calls.

## Goals / Non-Goals

**Goals:**
- Migrations always run with the gems the deployed lockfile names.
- One sequence for every deploy, so a retry does exactly what the first attempt did.

**Non-Goals:**
- Zero-downtime deploys. Recreating takes about as long as today's restart.
- Cleaning up old images.

## Decisions

### The sequence
```bash
docker compose build web || refuse 'the image did not build; the app was not restarted'
docker compose run --rm -T web bundle exec rake db:migrate < /dev/null || refuse 'database migrations failed; the app was not restarted'
docker compose up -d --force-recreate web
```
- **`build` first:** a failed build stops before anything changes. The running container keeps serving the old gems with the new code mounted, the same exposure as today between `git merge` and the restart.
- **`run --rm`:** a one-off container from the image just built, with the service's mount, `env_file` and environment, so it reads the same database settings as the app. `run` publishes no ports, so it doesn't clash with the running container's `4666`. `-T` and `< /dev/null` stay for the same reason as today's `exec`: the SSH session's input never closes.
- **`--force-recreate`:** on a redeploy with nothing changed the build is fully cached and yields the same image, and a plain `up -d` would then leave the container as it is. Forcing it makes every deploy restart the app, as the redeploy scenario requires. It also picks up `.env` edits, which a plain `restart` never did.
- **The diff and both branches go.** The script no longer needs `git diff`, or the "Code only" and "rebuild" messages.

### Alternatives
- **Rebuild before migrating, still chosen by the diff.** It fixes the first attempt, not the retry: the diff is empty once the server is on the tag. Remembering "a rebuild is owed" across runs would need state on disk for a case that an always-build handles for free.
- **`up -d --build` first, then migrate with `exec`.** The new code would serve requests before its migrations ran, and a failed migration would leave it live. That reverses what the migrations requirement guarantees.
- **`docker compose build` with no service name.** Same today (one service), but naming `web` keeps a later service from being built for nothing.

### Tests
In `spec/deploy_script_spec.rb`:
- **The fake `docker`:** it fails `compose build` when `FAKE_BUILD_FAILS` is set and `compose run` when `FAKE_MIGRATE_FAILS` is set. The open-input check moves from `exec` to `run`.
- **Every deploy that runs** expects `['compose build web', 'compose run --rm -T web bundle exec rake db:migrate', 'compose up -d --force-recreate web']`: a code-only change, a redeploy, each of `Gemfile`, `Gemfile.lock`, `Dockerfile` and `docker-compose.yml`, and the retry of a failed `Gemfile.lock` deploy.
- **A failed build:** stops after `compose build web`, with no migration and no curl.
- **A failed migration:** stops after the build and the migration, then a redeploy runs all three.
- **The output test** drops "rebuild" and keeps the tag and both short commits.

## Risks / Trade-offs

- [Every deploy leaves the previous image dangling: its `COPY . /app` layer, a few MB, while the gem layers are shared.] → It grows slowly. The owner can run `docker image prune -f` now and then. Automating that is out of scope.
- [A deploy now takes a few seconds longer for the cached build.] → Small next to the 15-minute test wait the workflow already has.
- [A build that needs the network (a gem change, or a base image not cached) can fail on a rubygems.org or Docker Hub outage.] → It fails before anything changes, and a retry builds again.
- [The first deploy after merging runs the old script.] → See the Migration Plan.

## Migration Plan

1. Merge, and release this change on its own, with no `Gemfile`, `Gemfile.lock`, `Dockerfile` or compose change in the same tag. The old script deploys it (it doesn't touch gems, so its `exec` migration works) and restarts.
2. From the next deploy on, the server runs the new script. Merge waiting Dependabot gem bumps after that.
3. Rollback: the script refuses a tag behind the server, so revert the merge on `master` and release a new tag. If the new script can't deploy at all, deploy by hand as before (`git pull --ff-only && docker compose up -d --build` on the server).
