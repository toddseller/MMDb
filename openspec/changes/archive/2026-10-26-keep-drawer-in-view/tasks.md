# Tasks

## 1. Revealing the drawer

- [x] 1.1 In `spec/js/drawer.test.js`, write failing tests for `reveal`, with the window, footer and tile positions stubbed:
  - a drawer ending below the footer scrolls down by the difference, smoothly;
  - a drawer taller than the space scrolls only until the tile's top meets its `scroll-margin-top`;
  - a drawer already in view doesn't scroll;
  - with `up`, a tile above the top limit scrolls up to it, and without `up` it doesn't;
  - under reduced motion it scrolls with `behavior: 'auto'`.

  Run them and see them fail for the missing export.
- [x] 1.2 Add `reveal` to `public/js/mmdb/drawer.js`, reading the top limit from the tile's `scroll-margin-top` and the bottom from the fixed `<footer>`. Verify the 1.1 tests pass.

## 2. Calling it wherever the drawer opens or reloads

- [x] 2.1 Write failing tests in `spec/js/drawer.test.js`:
  - `open` reveals at once with `up`, aiming at the predicted end (top + open margin + borders + `scrollHeight`);
  - a same-row `swap` reveals at its target height, without `up`;
  - a row switch reveals only after the 450ms hold, with `up`;
  - `keepOpen` reveals after its hold, without `up`;
  - an image `load` inside the drawer reveals, without `up`.
- [x] 2.2 Call `reveal` from `open`, `swap`, `show`'s row switch, `keepOpen` and a capturing `load` listener on the drawer. Verify the 2.1 tests pass.
- [x] 2.3 In `spec/js/show-edit.test.js`, write a failing test that `showSaved` (season switch) reveals without `up`, then call the exported `reveal` from `showSaved` in `public/js/mmdb/show-edit.js` and verify it passes. Run the whole JS suite (`npm test`) and `npx tsc --noEmit`.

## 3. In the browser

- [x] 3.1 In `e2e/drawer.spec.js`, add tests:
  - a poster in the last visible row opens with the drawer's bottom above the footer and the poster still on screen;
  - a drawer taller than a short window leaves the poster's row just below the top bar;
  - a drawer already in view leaves `scrollY` unchanged;
  - expanding "more" doesn't scroll.

  Run the whole RSpec, JS and Playwright suites; update any existing position test that now sees a glide to wait for the scroll to settle, and verify all pass.
- [x] 3.2 Run the app locally against the seeded e2e database (the local dev server uses production data) and record the glide when opening a low poster, switching rows and switching seasons; get the owner's approval before committing.

## Workflow follow-up

- Run the ponytail review on the diff before the first commit, then commit on `keep-drawer-in-view`, archive the change in the same PR and open it with `gh`.
- Deploy only after the producer repair's second pass and its apply have finished on the server.
