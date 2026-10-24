# Tasks

## 1. Grid list and drawer stylesheet

- [x] 1.1 Add `spec/detail_drawer_spec.rb` with stylesheet checks:
  - `public/css/drawer.css` lays out `#movie-list` and `#show-list` as grids with `gap` and gives `.info` `grid-column: 1 / -1`
  - it transitions `.info` on `grid-template-rows` (0fr closed, 1fr open), with no `max-height` on `.info`
  - it has a `prefers-reduced-motion: reduce` block
  - both theme `movies.css` files no longer set `.info` sizing, `nth-child` margins or `.notransition`
  - `default.css` and `dark.css` import `drawer.css?v=` and a raised `movies.css?v=`

  Run them and show them failing.
- [x] 1.2 Create `public/css/drawer.css` per design.md: grid lists, drawer motion, `.open` tile states with a `transform: scale` poster and pointer, reduced motion. Strip those rules from both theme `movies.css` files, leaving their colours. Import `drawer.css?v=1` and raise the `movies.css` versions in `default.css` and `dark.css`. Verify the new examples and the existing `page_assets_spec.rb` pass

## 2. One drawer module

- [x] 2.1 Add script checks to `spec/detail_drawer_spec.rb`:
  - `mmdb.js` no longer defines `filtered`, `filteredWithInfo` or `switchInfoDiv`
  - it has no hard-coded per-row counts (`itemsPerRow`, `% 7`, `? 7 : 6`)
  - it no longer removes `.info` from a `setTimeout`

  Run them and show them failing.
- [x] 2.2 Add the drawer module to `mmdb.js`: row end by `offsetTop`, `open`, `close`, `swap`, `afterTransition`, the scroll that keeps the poster still while the old drawer closes, and the tile's `.open` class. Rewrite `getMovieModal` and `closeInfo` on it, and point `displayUpdatedMovie`, `clearFilter` and `deleteMovie` at it. Delete `filtered`, `filteredWithInfo` and `switchInfoDiv`. Verify the new examples pass and run the whole suite

## 3. Browser check

- [x] 3.1 Run the app locally and check in Chrome, for movies and shows (7 and 6 per row, since the page stays 1386px wide):
  - opening, closing by poster and by ×, and reopening with one click
  - switching within a row and between rows, with the clicked poster staying put
  - the last, partly filled row
  - a filtered list (unwatched or 4K)
  - the edit form and a rating inside the drawer
  - the dark theme
  - reduced motion (emulated in DevTools)

  Record a GIF of the opening and switching, and note anything adjusted
- [x] 3.2 Run the whole suite and `openspec validate smooth-detail-drawer --strict`, and verify both pass

## Workflow follow-up

- Work on a feature branch, archive the change as the last commit of the PR, and open the PR with `gh`.
- After deploy, open and switch a few drawers on production as a final check.
