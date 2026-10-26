# Tasks

## 1. Moving the open drawer into a redrawn grid

- [x] 1.1 In `spec/js/drawer.test.js`, write failing tests for the new `drawer.js` export: with a drawer open, after the grid is replaced it sits after the open show's new row with its tile marked open, and eases from its old height to the new content's (`swap`); a missing or hidden poster leaves no drawer open and `isOpen()` false; with no drawer open it does nothing. Run them and see them fail for the missing export.
- [x] 1.2 Add the export to `public/js/mmdb/drawer.js`: detach the drawer, let the caller replace the grid, find the poster by its link id, reinsert after `rowEnd` and `swap` the new details. Verify the 1.1 tests pass.
- [x] 1.3 Give `holdStill` a duration argument (existing callers keep `DRAWER_MS`), and hold the open poster still across the move. Add a test that the poster's top is kept when a new show is inserted above it. Verify it fails first, then passes.

## 2. Keeping the drawer when episodes are added

- [x] 2.1 In `spec/js/preview.test.js`, write failing tests for `addEpisodes` with a drawer open:
  - it requests the open show's details after the add;
  - it replaces the grid and refreshes the drawer only once both have answered, so no state exists with the grid replaced and the drawer gone;
  - a failed details request still replaces the grid, with no drawer;
  - with no drawer open, no details request is made, and the existing adding tests still pass.
- [x] 2.2 Change `addEpisodes` and `showCollection` in `public/js/mmdb/preview.js` to use the 1.2 export, holding the poster still for the panel's close time (`CLOSE_AFTER_ADD_MS`). Verify the 2.1 tests pass, then run the whole JS suite (`npm test`).
- [x] 2.3 In `e2e/adding.spec.js`, add a test: open a show's drawer, add episodes to its season through the search panel, and see that the drawer stays open under the same poster listing the new episode. Add a second test with the drawer open on a different show than the one added to, and check that under reduced motion the drawer has no height transition (jsdom has no CSS, so this is checked in the browser). Run the whole RSpec, JS and Playwright suites and verify they pass.

## 3. Checking it in the browser

- [x] 3.1 Run the app locally, open a show's drawer, add a missing episode, and record a short screen capture showing the drawer staying open and easing to its new height with the poster still; get the owner's approval before committing.

## Workflow follow-up

- Run the ponytail review on the diff before the first commit, then commit on a feature branch from `master` and open the PR with `gh`, archiving the change in the same PR.
- Deploy only after the producer repair's second pass and its apply have finished on the server.
