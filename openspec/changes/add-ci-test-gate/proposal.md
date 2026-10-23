# Proposal

## Why

Apart from the 15 examples added by `optimize-shows-page-load`, nothing in MMDb is tested, and nothing runs those 15 before code reaches `master`, which the production server now deploys with `git pull`. Three clients outside this repo depend on its responses (toddseller.com on `/api`, the React front end on `/api/v2`, the dormant iOS app on `/api/v3`), so a regression here can break them unnoticed. This change is the first of a series that tests the whole project; it adds the merge gate and test foundation the later changes build on, so each of them lands behind a passing suite.

## What Changes

- A GitHub Actions workflow runs `bundle exec rspec` on every pull request to `master` and every push to `master`, against Postgres 11 (matching production) and Ruby 3.4.8, building the test database from `db/structure.sql`.
- `master` requires that check to pass before a pull request can merge. This is a GitHub repository setting; the tasks give the steps for the owner to enable it.
- Tests can no longer reach the network: WebMock blocks every outbound HTTP request, so later changes must stub Apple TV, TMDB, TVDB, Plex and Tautulli responses with recorded fixtures.
- Shared test factories in `spec/support` replace the `create_user` and `create_show` helpers copied across the existing specs.
- The test run sets dummy values for the environment variables the code reads (`JWT_SECRET`, `JWT_ISSUER`, `PLEX_USER`, `PLEX_USER_ID`, and the API keys), since CI has no `.env`.
- SimpleCov writes a line-coverage report on every run, locally and as a CI artifact, to show progress toward testing the whole project. Coverage is reported only; no minimum is enforced.
- Bug policy for this and later test changes: tests describe current behavior. Each bug a test exposes becomes an RSpec `pending` example and is listed in its change; security and data-loss bugs get their own fix change right away.

No application code or behavior changes.

## Capabilities

### New Capabilities
- `ci-test-gate`: how changes are verified before they reach `master`: the suite runs on every pull request and push, a failing run blocks the merge, tests never reach external services, and each run reports coverage.

### Modified Capabilities
None.

## Impact

- New: `.github/workflows/test.yml`, `spec/support/` (factories, WebMock and SimpleCov setup), `.rspec` loading `spec_helper`.
- Changed: `spec/spec_helper.rb` (test env defaults, support loading), the existing specs (shared factories), `Gemfile` and `Gemfile.lock` (`webmock` and `simplecov` in the `test` group), `.gitignore` (`coverage/`).
- GitHub: a branch rule on `master` requiring the test check, set by the repository owner. Actions minutes are free for public repositories.
- Dependabot pull requests will be tested before they can merge.
- Follow-up changes, in order: `secure-api-tokens-and-webhook` (JWT expiry for v2 and v3, a secret on the Plex webhook); model helpers and external-API parsers with recorded fixtures; contract tests for `/api` and `/api/v2`; request specs for the web pages; light tests for `/api/v3`.
