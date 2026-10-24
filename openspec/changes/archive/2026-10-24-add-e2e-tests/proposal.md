# Proposal

## Why

The front end runs on jQuery 1.9.1 (2013) and Bootstrap 3.3.6's JavaScript (2015). Both have published vulnerabilities, and the plan is to rewrite `public/js/mmdb.js` (1,035 lines) as plain modern JavaScript, with no jQuery.

Nothing tests that JavaScript today. The RSpec suite covers the server and the HTML it renders, but no test clicks anything. A rewrite of that size without tests would only reveal regressions when someone happened to use the broken feature.

This change adds browser tests for the major flows, written against today's code, before any of it is rewritten. Because they only drive the page, they keep working after the rewrite and show that behaviour hasn't changed.

## What Changes

- **Playwright tests** drive a real Chrome against the app for eight flows:
  1. the movie details drawer
  2. the filters
  3. adding a movie
  4. editing and rating a movie
  5. shows (adding an episode, setting the default season)
  6. modals, tabs and the theme switch
  7. artwork upload
  8. deleting a movie
- **Own database:** the tests run the app against a separate `MMDb_e2e` database, loaded with known data before each run. They never touch production, and the RSpec suite's database is left alone.
- **Same isolation as RSpec:** fixed test settings and no real credentials. The app may not reach any outside service, and the browser may not load anything from outside the app. Where a flow would reach Apple, TMDB or S3, the test answers the browser's request to the app itself.
- **CI:** the tests run in the existing required `test` job, after RSpec, so a pull request can't merge if they fail.
- **Scope:** no application code changes. The JavaScript rewrite and its unit tests (Node's test runner with jsdom) are later changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ci-test-gate`: adds that browser tests for the major flows run in the gate, under the same isolation as the RSpec suite.

## Impact

- New files:
  - `package.json` and `package-lock.json` (Playwright as a development dependency)
  - `playwright.config.js`
  - `e2e/` with the test files, a seed script and a server wrapper
- `.gitignore` gains Node and Playwright output.
- `.github/workflows/test.yml` gets Node, Chrome and Playwright steps in the `test` job.
- `README.md` gets a section on running the browser tests.
- No application code, data or deploy changes. The Docker image doesn't need Node.
