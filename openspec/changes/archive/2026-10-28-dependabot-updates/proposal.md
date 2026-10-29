# Proposal

## Why

Nothing tells the project when a dependency has a newer release, so updates happen only when someone remembers, and fixes for newly found vulnerabilities wait with them. The Docker base image is worse: `bin/deploy` rebuilds the web image only when a Dockerfile, compose file or the gems change, so Debian's security patches in `ruby:3.4.12` never reach production on their own. As exploits for known vulnerabilities appear faster, staying current needs to be the default, not a chore.

## What Changes

- Dependabot opens weekly pull requests for gems, npm packages, GitHub Actions and the Docker base image. Minor and patch updates arrive as one PR per ecosystem; each major update gets its own. Merging and tagging stay manual, gated by the existing `test` check.
- `Dockerfile` pins its base image by digest (`ruby:3.4.12@sha256:...`), so Dependabot also opens a PR when the same tag is republished with patched Debian packages; merging it changes the Dockerfile, so the deploy rebuilds.
- The Docker image decides production's Ruby patch version. `Gemfile` accepts any Ruby 3.4 patch (`~> 3.4.0`) and CI tests the newest 3.4, so a Dependabot bump of the base image doesn't break `bundle install`. Ruby minor and major versions remain deliberate changes.
- The `test` job builds the Docker image, so an image that doesn't build fails the PR rather than the deploy.
- **BREAKING (for docs and tooling only)** `Dockerfile.production` and `docker-compose.production.yml` are deleted with the documentation that describes them. Production has never used them: it runs `docker-compose.yml`, and its database is the PostgreSQL server on Proxmox, not the compose file's own Postgres container.

## Capabilities

### New Capabilities
- `dependency-updates`: how the project's dependencies and base image are kept current: which ones are watched, how often, how updates are grouped, and where the Ruby patch version is decided.

### Modified Capabilities
- `ci-test-gate`: the required check also builds the Docker image production runs.

## Impact

- New `.github/dependabot.yml`; `.github/workflows/test.yml` (Ruby `'3.4'`, an image build step); `Gemfile` and `Gemfile.lock`; `Dockerfile`.
- Deleted: `Dockerfile.production`, `docker-compose.production.yml`, and their sections in `README.md` and `DOCKER_DEPLOYMENT.md`. `spec/deploy_script_spec.rb` stops naming them in its examples; `bin/deploy` already matches any Dockerfile or compose file.
- The `test` job gets slower by the time an image build takes.
- Outside the repo: "Dependabot security updates" in the repository's Code security settings must be on for security fixes to arrive between the weekly runs. It can't be set from the repo.
- Not watched by Dependabot: the `actionlint` image run inside a `run:` step and the `cloudflared` release in `deploy.yml`; CI's `postgres:11` service follows the production database instead, and moves with the PostgreSQL migration.
