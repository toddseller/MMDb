# Tasks

## 1. Browser tests

- [x] 1.1 In `e2e/adding.spec.js`, add:
  - **Add search:** with movie results showing, opening Birch's details closes the panel and brings back Add Movie.
  - **Edit search:** with the edit form's results showing, opening Birch's details closes the panel.
- [x] 1.2 Run them against today's code and show both failing (the panel stays visible). Recorded: 2 failed, the details opened but `#preview` stayed visible.

## 2. Close the panel when a poster opens

- [x] 2.1 In `drawer.js`, call `preview.js`'s `close` when a poster's details are requested, not when its open drawer is closed. Run `npm test`, `npm run typecheck` and the browser tests.
- [x] 2.2 The first run failed six signed-out browser tests: a visitor's page has no add button, so `close` threw. In `spec/js/preview.test.js`, add "close works on a visitor's page", show it failing, then skip the add button in `close` when there is none. Give the drawer unit test's page the panel markup every real page has.
