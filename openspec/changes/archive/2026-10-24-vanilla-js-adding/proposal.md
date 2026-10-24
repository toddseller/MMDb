# Proposal

## Why

Change 3 of the seven that replace jQuery. Changes 1 and 2 moved the filters and the details drawer into typed ES modules. The adding flow comes next. It is about 300 lines of `public/js/mmdb.js` built around one panel (`#preview`): two searches and three add forms run through it, and movie edit's search borrows it.

Findings on the way:
- **The year field is dead code.** No view renders `#more` or `#search-year`, so `showYear` never runs. Most of the inline-style resets that follow every close (`#search-title` right, `.input-group-btn` and `#search-btn` top, `#movie-list` and `#show-list` top) only undo what `showYear` would have done.
- **The "Adding…" message is built as HTML from a search result's title.** A title containing `<` or `&` would be read as markup.
- **The scroll arrows depend on fixed sizes.** Each click scrolls a fixed 1386px, the panel's width at today's layout, and the end-of-results check subtracts the panel's 30px of padding by hand. `lastPos` is never updated, so its two branches do nothing. The arrows work today; reading the panel's own sizes keeps them working once the layout changes.

## What Changes

- **New module `public/js/mmdb/preview.js`**, typed with JSDoc and unit-tested first. It owns the panel:
  - opening and closing it, and the loading messages
  - the scroll arrows
  - the dismiss control
  - the movie and show searches, picking a show's season, and adding a movie, an episode or a whole season
- **The differences between the movie and show panels** (panel height, dismiss position, arrow size) come from one table in `preview.js`, with today's values. The CSS stays as it is, except for removing the dead `#search-year` rule from both themes.
- **The loading messages are set as text.** A title shows exactly as written.
- **The scroll arrows** scroll by the panel's measured width, and each shows only while there is more to scroll in its direction, as today.
- **`motion.js`** gains `slideDown` and `slideUp`, instant under reduced motion.
- **`window.preview`** lends the panel to movie edit's search (`updateDatabase`, and `displayEditForm` closing the panel) until change 4.
- **Create New Show stays jQuery** until change 5. It's offered when a show search fails.
- **Removed from `mmdb.js`:** `showSearchBar`, `showSearchBar2`, `showYear`, `checkDatabase`, `checkDatabase2`, `previewMovie`, `previewShow`, `addArrow`, `scrollRight`, `scrollLeft`, `movieToDB`, `showToDB`, `episodeToDB`, `listMovie`, `listEpisode`, `listShow`, `closePreview`, `closeUpdatePreview`, the `lastPos` and `first` variables, and their bindings.
- **Browser tests come first** for what isn't covered:
  - dismissing the panel
  - the scroll arrows
  - adding a whole season
  - a failed show search and a failed movie search
  - a title with markup characters in the "Adding…" message
  - the edit form's search, which now goes through `window.preview`

## Capabilities

### New Capabilities

- `adding-to-collection`: searching for a movie or show from the collection page, browsing the results, and adding a movie, an episode or a whole season.

### Modified Capabilities

None.

## Impact

- **New files:**
  - `public/js/mmdb/preview.js`, with a unit test in `spec/js/`
  - `e2e/adding.spec.js`, for the new browser tests
- **Changed:**
  - `public/js/mmdb/motion.js` and its test
  - `public/js/main.js`
  - `public/js/mmdb/legacy.d.ts`: types `window.preview`
  - `public/js/mmdb.js`: about 300 lines removed; `updateDatabase`, `displayEditForm` and `displayCreateShow` call `window.preview`; `deleteMovie` redraws the grid itself instead of through `listMovie`
  - `public/css/themes/default/movies.css` and `public/css/themes/dark/movies.css`: the dead `#search-year` rule removed, with their imports in `default.css` and `dark.css` raised to `?v=4`
  - `e2e/seed.rb`: recorded movie searches (many results, a title with markup) and an edit form search
- No server, route or data changes.
