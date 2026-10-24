# Tasks

## 1. Browser tests for what isn't covered yet

- [x] 1.1 In `e2e/seed.rb`:
  - give Amber the studio "Amber Films" and a third actor, "Cy Dunn", that no other movie has
  - give Harbor Lights 1x1 a plot longer than 130 characters
  - replace `Movie.search_person` to return a picture URL for "Cy Dunn" and nil otherwise
  - record `/movies/search` for "Cy Dunn" and for "Amber Films" into `e2e/.generated/`
- [x] 1.2 Add `e2e/credits.spec.js`:
  - Clicking "Cy Dunn" in Amber's details answers from the recording, doesn't navigate, and shows the profile header with the name and picture, only Amber and a cleared title search.
  - Clicking Amber's studio sends exactly one `/movies/search` request.
- [x] 1.3 Add an episode plot test to `e2e/shows.spec.js`: "more" shows the full plot and reads "less", and "less" truncates it again.
- [x] 1.4 Run the new tests against today's code. Credit and plot tests pass. The studio test fails with two requests, the bug this change fixes.

## 2. motion.js

- [x] 2.1 Write `spec/js/motion.test.js`, run it and show it failing:
  - `fadeOut` ends hidden and `fadeIn` ends shown
  - both are instant under reduced motion, or with no `el.animate`
  - both animate opacity over 400ms otherwise (with a stubbed `animate`)
- [x] 2.2 Write `public/js/mmdb/motion.js`, then run `npm test` and `npm run typecheck`.

## 3. drawer.js

- [x] 3.1 Write `spec/js/drawer.test.js` (tile `offsetTop` and `offsetParent` stubbed, `mock.timers` for the fallback) and show it failing:
  - `rowEnd` finds the last tile on the row and skips hidden tiles
  - `open` inserts after the row end and marks the tile `open`
  - `close` removes the drawer once its transition ends, or after 450ms with none; `close(true)` removes it at once
  - `show` swaps within a row and moves to another row
  - a poster click requests `/users/<id>/movies/<movie>` (or `shows` on the shows page) and opens the drawer; clicking the open tile's poster closes it
  - the footer fades out on open and in on close
  - `window.drawer` exposes `open`, `close` and `tile`
- [x] 3.2 Write `public/js/mmdb/drawer.js` and call its `init` from `main.js`. Type `window.drawer` in `legacy.d.ts` with elements.
- [x] 3.3 In `mmdb.js`:
  - remove the drawer object, `afterTransition`, `holdStill`, `DRAWER_MS`, `getMovieModal`, `closeInfo`, and the `.movie-modal`, `.show-modal` and `.close` bindings
  - point `seasonDefault`, `displayUpdatedMovie` and `deleteMovie` at `window.drawer`, unwrapping tiles with `[0]` and wrapping with `$()`
- [x] 3.4 Make `filters.js` import `close` from the drawer instead of `window.drawer`, and fade the count in with `fadeIn`. Update `filters.test.js` to match.
- [x] 3.5 Run `npm test`, `npm run typecheck`, and the drawer, filters, edit, delete and shows browser tests.

## 4. credits.js

- [x] 4.1 Write `spec/js/credits.test.js` and show it failing:
  - a credit click prevents navigation, resets `#filter-input` and sets `filterValue`
  - it requests `/movies/search` with the name encoded and the user id from the first tile or `sessionStorage`
  - it fills the profile header for both a picture and `no-image`, and replaces `#movie-list`
  - a studio click makes one request
  - the plot toggle flips `active` and the "more"/"less" text
- [x] 4.2 Write `public/js/mmdb/credits.js` and call its `init` from `main.js`. Remove `searchByName`, `expandPlot`, and the `.description-details a`, `.studio a` and `.expand-plot` bindings from `mmdb.js`.
- [x] 4.3 Run `npm test` and `npm run typecheck`. Then run all browser tests: the studio test now passes.

## 5. Check and finish

- [x] 5.1 Break checks: disable each new module binding in turn (drawer poster click, credit click, plot toggle) and confirm a browser test fails each time.
- [x] 5.2 Run the full suite: `bundle exec rspec`, `npm test`, `npm run typecheck` and `npx playwright test`.
- [x] 5.3 Update the README if it describes the drawer code or the module list.
- [x] 5.4 Run `openspec validate vanilla-js-drawer --strict`.

## Workflow follow-up

- Work on a feature branch. Archive as the change PR's last commit, then open the PR with gh.
- After the merge, the user deploys as `v2026.10.24.7`. Then validate the drawer, a credit search and a studio click on mmdb.online.
