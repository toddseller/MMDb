# Design

## Context

See proposal.md for why. The harness from `optimize-shows-page-load` already does most of the work: `spec/spec_helper.rb` forces `DATABASE_URL` to `postgres://localhost/MMDb_test`, loads `db/structure.sql` with `psql` into an empty database, rolls back each example and counts queries; `spec/request_helper.rb` drives the Rack app from `config.ru`. `Gemfile.lock` already lists `x86_64-linux`. Gaps found while planning:

- `.rspec` has no `--require spec_helper`, so `bundle exec rspec` with no spec files never loads the helper.
- `.ruby-version` is gitignored, so CI can't read the Ruby version from it.
- The code reads `JWT_SECRET`, `JWT_ISSUER`, `PLEX_USER`, `PLEX_USER_ID`, `TMDB_KEY`, `TMDB_TOKEN`, `TVDB_APIKEY`, `TVDB_PIN`, `TVDB_TOKEN`, `TAUTULLI_KEY`, `LIBRARY_KEY` and `HEROKU_KEY` from the environment. Some are concatenated into URLs (`'...apikey=' + ENV['TAUTULLI_KEY']`), which raises on `nil`.
- `create_user` and `create_show` are defined separately in `shows_page_spec.rb`, `grid_responses_spec.rb` and `smoke_spec.rb`.
- `coverage/` is already gitignored.

## Goals / Non-Goals

**Goals:**
- One required check that is fast enough to run on every pull request.
- Local runs and CI runs behave the same: same schema, same test settings, same network isolation.

**Non-Goals:**
- New tests for application logic (the follow-up changes).
- A coverage minimum, parallel test runs, or a test matrix across Ruby or Postgres versions.
- Automatic deploys after merge.

## Decisions

**1. One GitHub Actions job, `test`, with a `postgres:11` service.** Steps: check out, `ruby/setup-ruby` with `ruby-version: 3.4.8` and `bundler-cache: true`, `createdb MMDb_test`, `bundle exec rspec`, upload `coverage/`. Postgres 11 matches production, so `db/structure.sql` loads exactly as it does there. Triggers: `pull_request` to `master` and `push` to `master`; `permissions: contents: read`; a concurrency group cancels an older run for the same branch. *Alternative:* the latest Postgres image. Rejected: a dump from 11 loads on newer versions, but newer-only behavior would pass in CI and fail in production.

**2. Credentials through libpq variables, not a new URL.** The job sets `PGHOST=localhost`, `PGUSER=postgres` and `PGPASSWORD=postgres`. Both `pg` (used by ActiveRecord) and `psql` read them when the URL has no user, so `spec_helper`'s forced URL stays exactly as it is. *Alternative:* let CI pass `DATABASE_URL`. Rejected: the forced URL is the guard that keeps tests off production, and an override path would weaken it.

**3. Fixed test settings set in `spec_helper` before the app loads.** `spec_helper` assigns every variable listed in Context a fixed test value (for example `JWT_SECRET = 'test-jwt-secret'`) before requiring `config/environment`. `Dotenv.load` never overrides a variable that is already set, so a local `.env` can't leak real keys into tests. *Alternative:* `ENV[...] ||=`, keeping real values when present. Rejected: local and CI runs would then differ, and a test could pass only with real keys.

**4. WebMock with `disable_net_connect!` and no allow list.** Requests from `Rack::MockRequest` never touch the network and Postgres isn't HTTP, so nothing needs an exception. Later changes stub responses with `stub_request` and plain JSON fixture files under `spec/fixtures/`. *Alternative:* VCR cassettes. Rejected for now: recording needs live calls with real keys, and plain stubs are enough to test the parsers; a later change can add VCR if recordings prove useful.

**5. Plain Ruby factories in `spec/support/factories.rb`.** `create_user`, `create_show` (with `seasons:`, each season given one episode) and `create_movie` (with a `director`, which `Movie#create_director_check` needs), using a counter for unique user names and emails. The module is included into every example. *Alternative:* FactoryBot. Rejected: a new gem and DSL for three builders. `faker` stays in the Gemfile unused; fixed values make failures easier to read.

**6. SimpleCov started first in `spec_helper`.** It must start before any app file loads. It tracks `app/` and `config/`, filters `spec/`, and writes HTML to `coverage/`; its console summary puts the total in the CI log. No `minimum_coverage`. CI uploads `coverage/` with `actions/upload-artifact` even when tests fail (`if: always()`).

**7. `.rspec` gains `--require spec_helper`.** `bundle exec rspec` then always loads the helper, so the schema load, WebMock and SimpleCov run even for a single spec file. The existing `require_relative` lines become harmless duplicates and are removed.

**8. The merge rule is a repository ruleset on `master`, set by the owner.** It requires a pull request before merging and the `test` status check to pass. Branches don't need to be up to date with `master` first: with one contributor that would only add rebases. The owner keeps bypass permission for emergencies. The ruleset can only select the `test` check after the check has run once, so it is set up after this change's own pull request has run.

**9. Known bugs are `pending` examples.** A test that exposes a bug states the correct behavior inside `pending "<reason>"`. RSpec reports it as pending while the bug exists and fails the run once the bug is fixed, which prompts removing the marker. Each change lists the bugs it recorded. Security and data-loss bugs get their own fix change instead.

**10. The comments from the last change follow the comment rule.** In `spec_helper`, the query counter comment explains why `SCHEMA` and `TRANSACTION` events are skipped (ActiveRecord sends them on its own) instead of what the method does. The comment at the top of `grid_responses_spec.rb` is removed, since the `describe` text already says it.

## Risks / Trade-offs

- [`db/structure.sql` drifts if production's schema is changed by hand again] → the README's testing section says how to refresh it (`pg_dump --schema-only --no-owner --no-privileges`, then drop the `\restrict` lines).
- [The `postgres:11` image is end-of-life] → it is still published; move the service and production together when production upgrades.
- [The required check is matched by name] → renaming the `test` job silently drops the requirement; the job name is part of the spec contract and the workflow file says so in a comment.
- [Owner bypass can skip the gate] → it is visible on the merged pull request; it is kept because a solo maintainer can't otherwise fix a broken CI.
- [A WebMock block can hide inside rescue blocks] → `Movie.appletv_call` and `Show.get_series` rescue every error and print it, so a blocked request there shows up as an empty result, not a failure. The follow-up tests for those methods must stub requests and assert on the results.

## Migration Plan

1. Merge this change through a pull request, which runs the new workflow for the first time.
2. The owner creates the ruleset (tasks give the steps).
3. Verify with a throwaway pull request whose only commit makes one example fail: the merge button is blocked. Close the pull request and delete its branch.

Rollback: delete the ruleset, then revert the commit.
