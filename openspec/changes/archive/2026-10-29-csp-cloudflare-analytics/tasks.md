# Tasks

## 0. Branch

- [x] 0.1 Create `csp-cloudflare-analytics` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Allow the analytics script

- [x] 1.1 In `spec/content_security_policy_spec.rb`, change the header example to expect `script-src 'self' https://static.cloudflareinsights.com 'sha256-…'` and `connect-src 'self' https://cloudflareinsights.com`. Run it and see it fail on the current directives.
- [x] 1.2 Add the two hosts in `app/controllers/content_security_policy.rb`, with a one-line why comment. Verify 1.1 passes.

## 2. Verify

- [x] 2.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `csp-cloudflare-analytics`, archive the change in the same PR and open it with `gh`. The owner merges and deploys.
- After deploying: check the live header, then check `docker logs` over the next visits for `cloudflareinsights` reports (there should be none) and any `connect-src` report.
