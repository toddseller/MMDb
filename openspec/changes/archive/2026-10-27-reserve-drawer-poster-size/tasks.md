# Tasks

## 0. Branch

- [x] 0.1 Create `reserve-drawer-poster-size` from a freshly fetched `origin/master` and verify `git status` shows that branch, with this change's artifacts carried over.

## 1. The poster box

- [x] 1.1 In `spec/detail_drawer_spec.rb`, write failing checks:
  - `drawer.css` gives `#meta-data .description-poster img` `aspect-ratio: 2 / 3`, `object-fit: contain`, and a centred, `no-repeat`, `contain` background;
  - `drawer.css` gives `#info-header > .description-poster img` `aspect-ratio: 1`, after the movie rule;
  - neither theme's `movies.css` sets a `height` or `background: none` on `#info-header > .description-poster img`;
  - both themes set a `background-color` on both poster rules;
  - the theme import floors rise to the new `drawer.css`, `movies.css` and `modals.css` versions.

  Run `bundle exec rspec spec/detail_drawer_spec.rb` and see them fail on the missing rules.
- [x] 1.2 Add the two rules to `public/css/drawer.css`. In both themes' `movies.css`, replace `background: none` with the theme's colour (`#000` default, `#222` dark), and drop the dark theme's `height: 447px`. Give the dark `modals.css` movie poster `#222`. Raise the changed files' `?v=` in `public/css/default.css` and `public/css/dark.css`. Check that `responsive.css`'s phone rules leave `height: auto` and `max-width: 100%`, so the ratio follows the width. Verify the 1.1 checks pass.
- [x] 1.3 In `e2e/responsive.spec.js`, write tests that route the mzstatic full-size poster requests to never answer:
  - at 1500px a movie drawer's poster is 340x510 and a show's 447x447;
  - at 390px the drawer title's top is at or below the poster box's bottom, for a movie and for a show.

  Add a test that fulfils the show poster with a 400x600 SVG and checks the box is still 447x447. Run them against the code before 1.2 (`git stash` the CSS) to see the size checks fail, then with it to see them pass.
- [x] 1.4 In `e2e/responsive.spec.js`, write failing tests that a poster which fails to load (the fixture aborts it) still leaves the box at 340x510 for a movie and 447x447 for a show, and so does a season with no poster (`src=""`, Harbor Lights). Add `display: block` to the drawer poster rule in `drawer.css`, with its RSpec check, raise `drawer.css`'s `?v=`, and verify they pass.

## 2. The placeholder

- [x] 2.1 In `spec/js/drawer.test.js`, write failing tests:
  - `open` sets the drawer poster's `background-image` to the clicked tile image's `src`;
  - a same-row switch does the same with the newly clicked tile's `src`;
  - the poster's `load` clears the background;
  - its `error` keeps it.

  Run `npm test` and see them fail for the missing background.
- [x] 2.2 Add and export the placeholder helper in `public/js/mmdb/drawer.js` (design.md: set it via `style.backgroundImage` with a `JSON.stringify`-quoted URL, cleared on `load` with `{ once: true }`). Call it from `insert` and `swap` with the tile's `<img>` `src`. Verify the 2.1 tests pass.
- [x] 2.3 In `spec/js/show-edit.test.js`, write a failing test that a season switch leaves the new drawer poster's background as the old drawer poster's `src` (`https://img.test/old/600x600.jpg`). Then call the helper from `showSaved` in `public/js/mmdb/show-edit.js`, with the old poster's `src` read before the content is replaced. Verify it passes, then run `npm test` and `npm run typecheck`.
- [x] 2.4 In `e2e/drawer.spec.js`, with full posters held back, add tests:
  - clicking a movie tile shows its thumbnail URL as the drawer poster's computed `background-image`;
  - once the poster is answered, the background is `none`.

  Verify they pass.
- [x] 2.5 Delete the drawer's `load` → `reveal` listener in `insert` and its three tests in `spec/js/drawer.test.js` (an image loading glides, a closed drawer's image does nothing, the edit form's image doesn't glide): the poster was the only image that grew, and its box is now fixed. Run `npm test`, `npm run typecheck` and `e2e/drawer.spec.js` and verify they pass.

## 3. In the browser

- [x] 3.1 Run the whole RSpec, JS and Playwright suites and verify all pass.
- [x] 3.2 Run the app locally against the seeded e2e database, giving Harbor Lights' seasons posters there for the season switch, with full posters held back. Screenshot a movie and a show drawer while their posters load and after, on desktop and at 390px, and a season switch. Get the owner's approval before committing.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `reserve-drawer-poster-size`, archive the change in the same PR and open it with `gh`; the owner merges.
