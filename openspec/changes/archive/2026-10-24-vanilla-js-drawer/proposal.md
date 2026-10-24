# Proposal

## Why

Change 2 of the seven that replace jQuery. Change 1 (`vanilla-js-foundation`) set up typed ES modules, the import map and unit tests, and moved the filters. Next is the code the filters lean on: the details drawer, which is the shared state `filters.js` still reaches through `window.drawer`. With it come the links inside the details. Moving the drawer to a module lets later changes import it instead of going through a global.

Three findings on the way:
- **The drawer's close-button handler is dead.** `closeInfo` is bound to `.close` inside `#user-page`, but the only `.close` buttons are in Bootstrap modals outside it.
- **A studio click searches twice.** The studio link sits inside `.description-details`, so both the `.description-details a` and `.studio a` bindings fire, and each sends the same `/movies/search` request.
- **The `detail-drawer` spec claims behaviour the app doesn't have.** It describes closing by that button. That was assumed in `smooth-detail-drawer` and shown only with an injected button.

## What Changes

- **New modules**, each typed with JSDoc and unit-tested first:
  - `public/js/mmdb/drawer.js`: open, close, swap within a row, rows found by layout, waiting for transitions, holding the clicked poster still, and the poster clicks for movies and shows.
  - `public/js/mmdb/credits.js`: clicking a credit (actor, director, writer or producer) or the studio in the details searches the collection for that name and shows its profile header, with one request. It also toggles an episode plot's "more" and "less".
  - `public/js/mmdb/motion.js`: `fadeIn` and `fadeOut` using the Web Animations API, instant when the user asks for reduced motion.
- **`filters.js`** imports the drawer directly, and fades the movie count in again (instant since change 1).
- **`window.drawer` stays, now provided by `drawer.js`,** for three jQuery callers until changes 4 and 5: `displayUpdatedMovie`, `deleteMovie` and `seasonDefault`. It takes and returns elements; the two jQuery lines that pass or read a tile unwrap it with `[0]` or wrap it with `$()`.
- **Removed from `mmdb.js`:** the drawer code, `getMovieModal`, `searchByName`, `expandPlot`, the dead `closeInfo`, and the duplicate `.studio a` binding.
- **Browser tests come first** for the parts not yet covered: a credit search, one request for a studio click, and an episode plot's "more" and "less".

## Capabilities

### New Capabilities

- `details-links`: what clicking a credit, or an episode plot's "more", does inside the details drawer.

### Modified Capabilities

- `detail-drawer`: the "eases open and closed" requirement is replaced by one without the close button: its close-button scenario becomes closing by clicking the poster again, which the existing browser test already does. (A MODIFIED block cannot drop a scenario, so it is a remove and an add.)

## Impact

- **New files:** `public/js/mmdb/drawer.js`, `credits.js` and `motion.js`, with unit tests in `spec/js/`.
- **Changed:**
  - `public/js/mmdb/filters.js` and `public/js/main.js`
  - `public/js/mmdb/legacy.d.ts`: `window.drawer` becomes something the modules provide
  - `public/js/mmdb.js`: about 150 lines removed
  - `e2e/seed.rb`: a recorded credit search, and a long episode plot
  - two new browser test files
- No server, route or data changes.
