# Proposal

## Why

The Tests workflow is one job whose steps run in sequence: about 30 s of setup, the Docker image build (~56 s), RSpec, the JS tests and lint, the Playwright install (~19 s), and the 219 browser tests one at a time (~275 s), about 8 minutes in all. The browser tests share one seeded database, so they can't run in parallel inside one job, but separate jobs each get their own database and server. The image build only proves the image builds, so nothing else needs to wait for it.

## What Changes

- The workflow splits into parallel jobs: `image` (the Docker build), `unit` (lint, RSpec, typecheck, JS unit tests), and `browser`, which runs the Playwright suite in four shards, each on its own runner with its own Postgres and app server.
- A final job named `test`, the name the master ruleset requires and the deploy workflow waits for, runs after the others, even when one fails, and passes only if every one of them passed.
- Coverage and failing-browser-test reports are still uploaded, one report per shard.
- Expected wall time is about 2.5 to 3 minutes, down from about 8; the extra runner minutes are free for this public repository.
- Not in this change: running browser tests in parallel locally.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ci-test-gate`: the browser tests and the image build are now separate jobs that the required `test` check waits for, rather than steps of it; the `test` check fails when any of them fails, is cancelled or is skipped.

## Impact

- `.github/workflows/test.yml` restructured; `spec/dependency_updates_spec.rb` reads it and is updated.
- The master ruleset and `deploy.yml` keep working unchanged, since the final job is still named `test`.
