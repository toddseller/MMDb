# Design

## Context

- **Where the Ruby version is pinned.** `Gemfile` says `ruby '3.4.12'`. `Dockerfile` (the only one production uses, through `docker-compose.yml`) says `FROM ruby:3.4.12`, and CI's `setup-ruby` says `'3.4.12'`. The gitignored `.ruby-version` picks the local Ruby. Bundler refuses to run when the running Ruby doesn't satisfy the `Gemfile`'s `ruby` line, in frozen mode too. With `~> 3.4.0`, Ruby 3.4.8 ran against a lockfile that records 3.4.12 (checked during exploration).
- **When the image gets rebuilt.** `bin/deploy` rebuilds it only when `Gemfile`, `Gemfile.lock`, a `Dockerfile*` or a `docker-compose*.yml` changes between the old and new commit; otherwise it restarts the container. CI never builds the image.
- **What CI pins.**
  - `test.yml` uses `actions/checkout@v7`, `ruby/setup-ruby@v1`, `actions/setup-node@v7` and `actions/upload-artifact@v7`. `deploy.yml` uses `actions/checkout@v7`.
  - The `actionlint` image runs inside a `run:` step, and `deploy.yml` downloads a pinned `cloudflared` release by URL. Dependabot can see neither.
  - The `postgres:11` service matches the production database (specs/ci-test-gate, "Tests run against the production schema").
- **The unused production setup.** `Dockerfile.production` and `docker-compose.production.yml` aren't used by any deploy. `README.md` (Option 4, "Docker Production Deployment", the file tree, and a few commands) and most of `DOCKER_DEPLOYMENT.md` describe them.

## Goals / Non-Goals

**Goals:**
- The behaviour in specs/dependency-updates and the new requirement in specs/ci-test-gate.

**Non-Goals:**
- Merging or deploying automatically.
- Watching `actionlint`, `cloudflared` or the CI Postgres image. The Postgres image moves with the database migration.
- Dependabot for MyFlix or the Tesla project; they can copy this file later.
- Changing the repository's security settings, which only the owner can reach.

## Decisions

**One `.github/dependabot.yml` with four entries: `bundler`, `npm`, `github-actions` and `docker`, all at `/` and checked weekly.** Each entry has one group whose `update-types` are `minor` and `patch`, so those arrive together, and a major update, which isn't in the group, opens its own PR. Weekly keeps the PR count reviewable; security fixes don't wait for it once the owner turns on Dependabot security updates. Rejected:
- Daily checks: too many PRs for one person.
- One group across all ecosystems: a failing npm bump would hold back a gem fix.

**The `docker` entry ignores minor and major updates of `ruby`** (`ignore` with `version-update:semver-minor` and `version-update:semver-major`), so only Ruby patch releases and digest changes are proposed. A move to 3.5 or 4.0 needs the `Gemfile` and CI changed too, so it stays deliberate.

**`Dockerfile` pins `FROM ruby:3.4.12@sha256:<index digest>`.** The digest is the multi-platform index digest from `docker buildx imagetools inspect ruby:3.4.12`, so the same line builds on the amd64 server and on an arm64 Mac. Dependabot updates the digest when the tag is republished, and updates both together on a new patch release. Rejected: a scheduled rebuild on the server (another job outside the repo, and an image nobody reviewed).

**`Gemfile` says `ruby '~> 3.4.0'`, and CI says `ruby-version: '3.4'`.** The Dockerfile becomes the only file a Ruby patch bump has to change. CI may test a newer 3.4 patch than production runs until the base image PR merges; patch releases don't change behaviour, so that window is harmless. `Gemfile.lock`'s `RUBY VERSION` line stays as Bundler writes it.

**The `test` job builds the image with a plain `docker build .` before the test steps, without pushing it.** A broken image then fails the PR before minutes are spent on tests. Rejected: `docker/build-push-action` with a layer cache (another action to keep current, for a build that runs once per PR).

**Delete `Dockerfile.production` and `docker-compose.production.yml`, and remove the documentation that describes them.** In `README.md`:
- Option 4.
- "Docker Production Deployment".
- The tree entry.
- The production compose commands under Troubleshooting and Health Checks.

`DOCKER_DEPLOYMENT.md` keeps its development setup and environment variables, and loses the production, container management, scaling, troubleshooting, backup and updating sections, which all assume the production compose file. `spec/deploy_script_spec.rb`'s list of files that trigger a rebuild drops the two names, since `bin/deploy` matches by pattern.

**Tests.** A new `spec/dependency_updates_spec.rb` reads the repo's own files:
- **The Dockerfile's `FROM` line pins a digest.** It fails today.
- **The Ruby requirement:** `Bundler.definition.ruby_version` accepts the Dockerfile's Ruby version and the next patch after it. It fails today on the next patch.
- **CI builds the image:** `test.yml`'s `test` job has a step running `docker build`. It fails today.

There's no test for `dependabot.yml` itself; GitHub validates it on push and shows errors on the repository's Dependabot page.

## Risks / Trade-offs

- [A burst of PRs the first week] → Grouping keeps it to about one PR per ecosystem plus each pending major (Puma 8, json 3, will_paginate 4, ActiveRecord 8 if the constraint allows).
- [The image build adds time to every CI run] → It runs once per run without a cache; acceptable for the safety it adds.
- [CI tests a different Ruby patch than production for a few days] → Same minor version; the base image PR closes the gap.
- [Someone used the production compose file locally] → It never matched production; the README's development options remain.

## Migration Plan

Merge, then check the repository's Insights, Dependency graph, Dependabot page for errors, and in Settings, Code security, turn on Dependabot security updates. The first PRs arrive at the next weekly run. No deploy-time effect: the Dockerfile's digest change rebuilds the image once with the same Ruby and packages.
