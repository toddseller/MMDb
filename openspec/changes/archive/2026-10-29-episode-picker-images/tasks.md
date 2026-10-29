# Tasks

## 0. Branch

- [x] 0.1 Create `episode-picker-images` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. The picker shows every preview as an image

- [x] 1.1 Add a failing request spec: post a new show's season as its owner (XHR) with `Show.get_episodes` stubbed to return three episodes, one with an Apple preview whose file name contains `video`, one with a TMDB still and one with an empty preview. Expect the returned `page` to list all three, each with an `<img>` carrying `data-fallback`, no `<video>`, and three entries in the Add All Episodes form. Run it and see it fail on the Apple episode's `<video>`.
- [x] 1.2 In `_episodes_preview.erb`, remove the `video` branch and both `'NA'` checks. Verify 1.1 passes.

## 2. Verify

- [x] 2.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass, including the browser tests that add episodes with no CSP violation.
- [x] 2.2 Take a screenshot of the episode picker with an Apple episode whose preview contains `video`, before and after, in the dark theme, and show it to the owner for approval before committing.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `episode-picker-images`, archive the change in the same PR and open it with `gh`. The owner merges and deploys.
- After deploying: the next time a season is added, check `docker logs` for `media-src` CSP reports; there should be none.
