# Tasks

## 0. Branch

- [x] 0.1 Create `deploy-waits-for-test` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. The gate waits for a missing check

- [x] 1.1 Add `spec/deploy_gate_spec.rb`: read the "Check the tag is a tested commit on master" step from `.github/workflows/deploy.yml` and run its script with bash, with stand-in `gh`, `git` and `sleep` on the PATH (`git` reports the tag's commit and that it is on master; `gh` answers a scripted sequence of check states; `sleep` returns at once). Examples: missing, missing, then success deploys (exit 0); running then failure stops naming `failure`; missing on every check stops naming `missing` after the full wait. Run them and see the first fail on today's gate.
- [x] 1.2 In `deploy.yml`, keep waiting while the state is `running` or `missing`, and update the comment to say why the check can be missing. Verify 1.1 passes and actionlint is clean.

## 2. Verify

- [x] 2.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `deploy-waits-for-test`, archive the change in the same PR and open it with `gh`. The owner merges, then tags right away; check the deploy log shows it waiting and then deploying.
