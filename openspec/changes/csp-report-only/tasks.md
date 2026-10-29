# Tasks

## 0. Branch

- [x] 0.1 Create `csp-report-only` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Fallback images without inline handlers

- [x] 1.1 Add `spec/js/fallback.test.js` with failing tests for `fallback.js`'s `init(document)`: an `img[data-fallback]` that fires `error` gets the fallback `src` and loses the attribute; a second `error` changes nothing; an image without `data-fallback` is left alone; an image that already failed before `init` (complete, `naturalWidth` 0) gets its fallback on `init`. Run `npm test` and see them fail on the missing module.
- [x] 1.2 Write `public/js/mmdb/fallback.js` and start it from `main.js`. Verify `npm test` and `npm run typecheck` pass.
- [x] 1.3 Add a failing RSpec example that no view under `app/views` and no script under `public/js/mmdb` contains an inline `on…=` handler attribute or a `style=` attribute. Run it and see it fail on the three handlers and nine styles.
- [x] 1.4 Replace the three `onError` attributes with `data-fallback` (same fallback URLs) and move the nine inline styles to CSS classes or rules. Verify 1.3 passes and `npm test` still passes.

## 2. Report endpoint

- [x] 2.1 Add failing RSpec examples for `POST /csp-reports`: a report (`application/csp-report`, for an image blocked on `/users/1?letter=a`) answers 204 without a session cookie and logs one `CSP …` line with the directive, blocked address and `/users/1`, without query strings; a 9 KB body answers 400 and logs nothing; a body without `csp-report` answers 400 and logs nothing. Run them and see them fail with 404.
- [x] 2.2 Add the route. Verify 2.1 passes.

## 3. Report-only header

- [x] 3.1 Add failing RSpec examples: a page response carries `Content-Security-Policy-Report-Only` with the directives in design.md and `'sha256-…'` equal to `Digest::SHA256.base64digest` of the import map text in that page's body. Run them and see them fail.
- [x] 3.2 Add the `after` filter. Verify 3.1 passes.

## 4. Browser tests fail on violations

- [x] 4.1 In `e2e/fixtures.js`, make the `page` fixture record `securitypolicyviolation` events and fail the test if any occurred. Show it working first: temporarily break the hash (or add an inline `style` in a view), run one browser test, see it fail naming the violation, then undo that.
- [x] 4.2 Run `npm run test:e2e` and verify all browser tests pass with no violations.

## 5. Verify

- [x] 5.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass.
- [x] 5.2 Take screenshots of a movie list with a missing poster (showing the animated fallback), the show info page and the show search placeholder, in the dark theme, before and after, and show them to the owner for approval before committing.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `csp-report-only`, archive the change in the same PR and open it with `gh`. The owner merges and deploys.
- After deploying: check the live header with `curl -sI https://mmdb.online/`, post a sample report and see its line in `docker logs`, then check the log for real reports over the following days.
