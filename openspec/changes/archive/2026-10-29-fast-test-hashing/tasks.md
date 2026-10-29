# Tasks

## 0. Branch

- [x] 0.1 Create `fast-test-hashing` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Measure today

- [x] 1.1 Record the current times: `bundle exec rspec` (the "Finished in" line) and `npm run test:e2e` (the summary line), on this machine.

## 2. Minimum cost in tests, default cost in the app

- [x] 2.1 In `spec/password_rules_spec.rb`, add failing examples: a user created by `create_user` has a hash whose cost is `BCrypt::Engine::MIN_COST`; and a separate Ruby process that loads `config/environment` without the test settings reports `BCrypt::Engine.cost` equal to `BCrypt::Engine::DEFAULT_COST`. Run them and see the first fail on cost 12.
- [x] 2.2 In `spec/support/test_env.rb`, set `BCrypt::Engine.cost = BCrypt::Engine::MIN_COST` with a one-line why comment. Verify 2.1 passes.

## 3. Verify

- [x] 3.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, verify they all pass, and compare the RSpec and browser-test times with 1.1.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `fast-test-hashing`, archive the change in the same PR and open it with `gh`; compare the PR's CI step times (RSpec ~96 s, Playwright ~275 s) with the run before. The owner merges.
- Next change: split CI into parallel jobs with sharded browser tests and a final `test` job.
