# Proposal

## Why

The deploy for `v2026.10.29.10` stopped with "the test check for 9289026… is missing" about 30 seconds after the merge of #483, while that commit's tests were still running. Since #483, the `test` check is the final job of the Tests workflow, and GitHub only creates it after the image, unit and browser jobs finish. The deploy's gate waits while the check is "running" but stops at once when it is "missing", which was correct when `test` was the workflow's only job and existed from the start of the run. Nothing unsafe deployed, but every tag pushed soon after a merge now fails until it is re-run.

## What Changes

- The deploy gate waits while the tag's `test` check is missing as well as while it is running, within the same limit (45 checks, 20 seconds apart, about 15 minutes).
- A tag whose commit never gets a `test` check still fails, after that wait, with the same message naming the state.
- A spec runs the gate step itself with stand-in commands, so the gate is tested for the first time.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `deploy-on-tag`: the tested-commit requirement waits for a `test` check that has not been created yet, not only one that is running.

## Impact

- `.github/workflows/deploy.yml` (one condition) and a new spec reading it.
- Deploys tagged right after a merge wait for the tests instead of failing.
