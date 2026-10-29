# Tasks

## 0. Branch

- [x] 0.1 Create `parallel-ci` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. The layout, test first

- [x] 1.1 In `spec/dependency_updates_spec.rb`, update the workflow examples and add failing ones: the `image` job runs `docker build`; the `unit` and `browser` jobs use `postgres:18`; `browser` is a matrix of shards whose `run` passes `--shard=${{ matrix.shard }}/` with the shard count, with `fail-fast: false`; and the `test` job needs `image`, `unit` and `browser`, runs `if: always()`, and fails unless every needed result is `success`. Run them and see them fail on today's single job.
- [x] 1.2 Restructure `.github/workflows/test.yml` into the four jobs in design.md, keeping each step's why comment with the step it explains, and the ruleset comment on the `test` job. Verify 1.1 passes and actionlint is clean.

## 2. Verify

- [x] 2.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e` locally, and run `npx playwright test --shard=N/4` for N = 1 to 4 and verify the four shards together run all 219 browser tests.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `parallel-ci`, archive the change in the same PR and open it with `gh`. Check the PR's jobs and their times against the single-job run (about 8 minutes).
- With the owner's go-ahead, push a temporary commit that fails one browser test, confirm the `test` check fails, then push a commit reverting it and confirm `test` passes. The owner merges.
