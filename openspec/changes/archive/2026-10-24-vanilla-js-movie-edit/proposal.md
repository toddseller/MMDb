# Proposal

## Why

Change 4 of the seven that replace jQuery. Changes 1 to 3 moved the filters, the details drawer and adding to the collection into typed ES modules. Movie edit comes next: the edit form in the drawer, saving, deleting, the form's search that refreshes a movie's details, the quality checkboxes and the star rating. Its nine jQuery functions are the last readers of `window.filterValue` and the main borrowers of `window.drawer` and `window.preview`.

Findings on the way:
- **The edit form lands in every `.modal-body` on the page.** `displayEditForm` replaces them all, so a copy goes into the hidden sign-in/profile modal too. The browser tests work around it with `:visible`.
- **A non-library user can't save a movie marked New.** In `_edit_movie.erb` the checked checkbox is named `movie[isnew` (no closing bracket). Rack reads that as an attribute called `[isnew`, which the model doesn't have, so the save answers 500 and nothing changes.
- **Delete closes the drawer before the server answers.** If the delete fails, the movie stays in the grid and nothing says so. A failed update is just as silent.
- **The star rating cancels its own click,** then paints the checked look with inline colours until the reply re-renders the stars. The stylesheet already draws a checked radio.
- **The delete form's action is the placeholder `"test"`.** The handler copies the edit form's action onto its button and reads it back.
- **The edit form's Search uses the movie's stored title, not what's typed.** This is intended: it re-fetches the open movie's details from the movie database, for movies added without Apple's data. It stays, and the spec records it.

## What Changes

- **New module `public/js/mmdb/edit.js`**, typed with JSDoc and unit-tested first. It owns:
  - opening the edit form from the drawer's edit link, inside the drawer only
  - saving (Update, or Enter in a field), which redraws the grid and reopens the drawer on the movie
  - deleting, which closes the drawer only once the server confirms
  - the form's Search, and picking a result to refresh the form
  - the quality checkboxes, at most one checked
  - the star rating, with the radio checking itself
- **A failed save or delete shows an error line under the form's buttons.** The drawer stays open and the grid is untouched. The line is in the partial, hidden until needed, like sign-in's `login-errors`.
- **`_edit_movie.erb`:** the `isnew` name fixed, the delete form's action set to the movie's URL, and the error line added.
- **The current list query moves from `window.filterValue` into `filters.js`.** It's set by the title search, credits searches and Clear, and read when a save or delete redraws the grid. It is no longer shared through `window`.
- **`preview.js` exports `search` and `close`** for `edit.js`. `window.preview` shrinks to `{ close }` for Create New Show, and `window.drawer` to `{ tile }` for the season default, both until change 5.
- **Removed from `mmdb.js`:** `editMovie`, `displayEditForm`, `submitUpdate`, `submitPreviewUpdate`, `displayUpdatedMovie`, `deleteMovie`, `updateDatabase`, `ratingSubmit`, `toggleHD`, the `filterValue` variable, and their bindings.
- **Browser tests come first** for what isn't covered:
  - the form appears only in the drawer
  - picking a search result refreshes the form
  - the quality checkboxes
  - New survives a save
  - a failed save and a failed delete
  - saving and deleting while the title filter is on

## Capabilities

### New Capabilities

- `movie-edit`: editing a movie from its details drawer: the edit form, saving, deleting, refreshing its details from a search, its quality and New flags, and rating it.

### Modified Capabilities

None.

## Impact

- **New files:**
  - `public/js/mmdb/edit.js`, with `spec/js/edit.test.js`
  - `e2e/movie_edit.spec.js`, for the new browser tests
- **Changed:**
  - `public/js/main.js`
  - `public/js/mmdb/filters.js` and `credits.js`, with their tests: the list query
  - `public/js/mmdb/preview.js` and `drawer.js`, with their tests: the exports and the smaller `window` loans
  - `public/js/mmdb/legacy.d.ts`: `filterValue` removed, `drawer` and `preview` narrowed
  - `public/js/mmdb.js`: about 90 lines removed
  - `app/views/partials/_edit_movie.erb`
  - `e2e/edit_rate.spec.js`: the `:visible` workaround removed
- No route, data or CSS changes.
