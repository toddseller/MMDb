# Tasks

## 0. Branch

- [x] 0.1 Create `upgrade-ruby-3-4-12` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Ruby 3.4.12 locally

- [x] 1.1 Install Ruby 3.4.12 with `ruby-install ruby 3.4.12` (it lands in `~/.rubies/ruby-3.4.12` next to 3.4.8), set the gitignored `.ruby-version` to `3.4.12`, and verify `ruby -v` in the project prints 3.4.12.
- [x] 1.2 Change `ruby '3.4.8'` to `ruby '3.4.12'` in `Gemfile`, run `bundle install` so `Gemfile.lock`'s `RUBY VERSION` becomes 3.4.12 and no gem version changes, and verify with `git diff Gemfile.lock` that only the Ruby line moved.

## 2. Images, CI and docs

- [x] 2.1 Change `ruby:3.4.8` to `ruby:3.4.12` in `Dockerfile`, and `ruby:3.4.8-slim` to `ruby:3.4.12-slim` in both stages of `Dockerfile.production`. Verify with `docker build -t mmdb-ruby-check .` that the image builds and `docker run --rm mmdb-ruby-check ruby -v` prints 3.4.12.
- [x] 2.2 In `.github/workflows/test.yml`, set `ruby-version: '3.4.12'` and `runs-on: ubuntu-latest`, and replace the comment about the missing 3.4.8 build with one line saying the runner follows GitHub's current image on purpose, and that a Ruby setup failure after GitHub moves it means the pinned Ruby needs a newer patch release. In `.github/workflows/deploy.yml`, set `runs-on: ubuntu-latest` and delete its pin comment. Verify with `docker run --rm -v "$PWD:/repo:ro" -w /repo rhysd/actionlint:1.7.7 -no-color` that both workflows lint clean.
- [x] 2.3 Change 3.4.8 to 3.4.12 in `README.md` (both places) and `DOCKER_DEPLOYMENT.md`, and verify `git grep -n "3\.4\.8" -- ':!openspec'` finds nothing.

## 3. Verify

- [x] 3.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e` on Ruby 3.4.12, and verify they all pass.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `upgrade-ruby-3-4-12`, archive the change in the same PR and open it with `gh`; check that the PR's `test` job passes on `ubuntu-26.04`. The owner merges.
- After the deploy, check that the web container reports Ruby 3.4.12 (`docker exec mmdb-web-1 ruby -v`) and the site loads.
