# Design

## Context

`.github/workflows/test.yml` has one job, `test`, which the master ruleset requires by name (`required_status_checks: test`, GitHub Actions app), and which `deploy.yml` waits for by name (`check-runs?check_name=test` on the tagged commit). Its steps, with times from recent runs: image build ~56 s, Ruby setup, actionlint, RSpec ~96 s (about 30 s once test hashing is cheap), coverage upload, Node setup, `npm ci`, typecheck, JS unit tests ~8 s, Playwright install ~19 s, browser tests ~275 s. The browser tests run with `workers: 1` because they share one seeded database (`MMDb_e2e`), and `playwright.config.js` starts the app server itself.

## Goals / Non-Goals

**Goals:**
- Wall time near the slowest single job, about 2.5 to 3 minutes.
- The required check and the deploy gate keep working without changing the ruleset or `deploy.yml`.

**Non-Goals:**
- Parallel browser tests on one machine (needs a database and server per worker).
- Caching the Docker build; once it runs alongside, it is off the critical path.

## Decisions

- **Four jobs.** `image`: checkout and `docker build .`. `unit`: Postgres service, Ruby, actionlint, `MMDb_test`, RSpec with the coverage upload, Node, `npm ci`, typecheck, `npm test`. `browser`: a matrix of shards 1 to 4, each with its own Postgres service, Ruby, Node, `npm ci`, Playwright install, `MMDb_e2e`, and `npx playwright test --shard=N/4`; a failure uploads `playwright-report-N`. `test`: `needs: [image, unit, browser]`.
- **The final job runs always and checks every result.** GitHub treats a skipped required job as passing, so `test` uses `if: always()` and fails unless every needed job's result is `success`; `needs.*.result` covers every shard through the matrix job's combined result.
- **Four shards.** Playwright shards by file here (`fullyParallel` is off), and the slowest file (`account.spec.js`, ~54 s locally) bounds a shard; four shards (raised from three after a local run left one shard at 1.8 min and another at 34 s) keep each near 1 minute of tests plus about 1 minute of setup, close to the `unit` job. More shards would add setup time for little gain.
- **`fail-fast: false` on the matrix,** so one failing shard still lets the others report their failures in the same run.
- **Postgres and the test environment move with the jobs that use them** (`unit`, `browser`); `image` needs neither.

## Risks / Trade-offs

- [More runner minutes: setup repeats in five jobs] → Free for this public repository.
- [Shards uneven as files grow] → Wall time is the slowest shard; rebalance by raising the count later.
- [A misconfigured final job could pass while a shard fails] → Verified on the PR by pushing a commit that fails one browser test, seeing `test` fail, then reverting.

## Migration Plan

Merge as usual; the next push to master runs the new layout, and the ruleset and deploy gate see the same `test` check. Rollback is reverting the workflow.
