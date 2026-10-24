# Design

## Context

Movie edit is nine functions in `public/js/mmdb.js`, bound on `#user-page`. The markup is `_edit_movie.erb` (the form), `_update_preview.erb` (the search results, `#update-movie` forms) and `_ratings_form.erb` (the stars, inside `#ratings-container` in `_info.erb`). The routes:

| Action | Request | Answer |
| --- | --- | --- |
| Open the form | `GET /users/:uid/movies/:id/edit` | JSON string: the form |
| Save | `PUT /users/:uid/movies/:id` with the form plus `filter` or `name` | `{ page, query, id }`: details, grid, movie id |
| Delete | `DELETE /users/:uid/movies/:id` with `filter` or `name` | `{ status, page, movie_count }` |
| Search | `GET /movies/update?title=&route=` | `{ query, page }` |
| Pick a result | `PUT /movies/update/:id` with the result's fields | JSON string: the form |
| Rate | `POST /movies/:id/ratings` with `rating` | HTML: the stars |

`filter` or `name` tells the server which list to redraw. Today the choice is made when the request is sent: `filter` when the title search box has text, otherwise `name`, both carrying `window.filterValue`. The title search sets that value to the box's text, a credits search sets it to the name (and clears the box), and Clear resets it.

Module conventions from changes 1 to 3 apply: `// @ts-check` with JSDoc, `#mmdb/` imports, `on()` delegation bound on `document`, `request()`, and `init(document)` called from `main.js`.

## Goals / Non-Goals

**Goals:**
- Movie edit looks and behaves as it does today, apart from the fixes the proposal names.
- Nothing in movie edit reads `window`. `filterValue` leaves `window` entirely.

**Non-Goals:**
- Changing any route or what it returns.
- Errors for a failed rating or a failed form open. Both stay silent, as today.
- The Edit and Delete styling, or the form's layout.
- The duplicate `id="movie_title"` on the sort-name field and the space-containing `movie-hd …` ids. They're harmless to this change and belong with a markup clean-up.

## Decisions

**One module, `edit.js`, for the form, the quality checkboxes and the stars.** They're one feature to the user and share the drawer. Splitting off the stars (about ten lines) and the checkboxes (about five) would add two files and two `init` calls for no gain. Alternative: give the stars to `drawer.js`, which owns the details. Rejected: `drawer.js` is about placing and animating the drawer, not about what's in it.

**The form replaces only the drawer's `.modal-body`.** That is `.info .modal-body`, the details today and the form's own `.modal-body` once it's open, so a refresh after picking a result lands in the same place. The jQuery line that hid `.modal-footer` goes. The drawer has no footer, so it only ever hid the sign-in modal's.

**Submit events, not button clicks.** `.edit-form`, `#delete-form` and `#update-movie` are bound on `submit`, so Enter in a field saves through the same path as Update. Today Enter does a full-page PUT, which navigates. The stars and the quality checkboxes are bound on `change`.

**The delete form gets its own action.** `_edit_movie.erb` renders `#delete-form` with the movie's URL, the same as the edit form's. The handler reads it from the form instead of copying it from the edit form.

**The current list query lives in `filters.js`.** Its title search and Clear already own it. `filters.js` exports `rememberQuery(value)` for `credits.js` and `listQuery(document)` for `edit.js`. `listQuery` returns `{ filter: value }` or `{ name: value }`, chosen by the search box at call time, as today. Alternatives:
- A new module just for the value: an extra file for two functions, and filters already owns the state.
- Keeping `window.filterValue`: leaves shared mutable state on `window`, which the plan removes piece by piece.

**Finding the movie's poster after a save uses its link.** The jQuery code used `$('#' + id).parent('div')`. Poster links carry the movie id and tiles carry the user id, so a movie whose id equals the user's id would find the wrong element. `edit.js` looks up `.movie-modal[id="<id>"]` inside `#movie-list` and opens the drawer on its parent tile, at once, after closing the old drawer at once, as today.

**The error line is in the partial.** `<p class="edit-error text-danger" role="alert" hidden>` sits under the buttons. `edit.js` sets its text with `textContent`: "Couldn't save <title>. Try again." or "Couldn't delete <title>. Try again." The title is the title field's `defaultValue`, the stored title. Bootstrap's `text-danger` and its `[hidden]` rule style it, so no CSS changes. Each new attempt hides the line until it fails again. Alternative: build the line in JS. Rejected: the markup belongs with the form it sits in, the same way sign-in's `login-errors` does.

**Search reads the stored title.** `updateDatabase` read the textarea's `.text()`, which is its markup content, not what's typed. `edit.js` uses `defaultValue` for the same value, so the behaviour the spec records is visible in the code.

**The stars check themselves.** The radio is no longer cancelled, so the stylesheet's `:checked` rules draw the choice at once. The inline colours and the `.rating>p` offset (which matched nothing) go. The reply replaces `#ratings-container` as before.

**`preview.js` and `drawer.js` export what `edit.js` needs.** `preview.js` exports `search` and `close`. `close`'s duration defaults to the panel's 300ms, so callers don't pass it. `edit.js` imports `open` and `close` from `drawer.js`, which already exports them. The `window` loans shrink to what change 5's jQuery still uses: `window.drawer` to `{ tile }` (the season default) and `window.preview` to `{ close }` (Create New Show).

## Risks / Trade-offs

- [Arrow keys on the stars post each step: with `change`, moving 1 to 5 by keyboard saves four ratings, and each reply replaces the stars, which loses focus.] → Accepted. Today the keyboard can't rate at all, and the last step wins. Revisit if the stars move to a real control in change 7.
- [The delete sends its `filter`/`name` in a `DELETE` body.] → jQuery does the same today, and Rack parses a form-encoded body for any method. The filtered-delete browser test covers it.
- [Module state in `filters.js` persists between unit tests in one process, unlike `window.filterValue` on each test's fresh jsdom window.] → Tests that depend on it call `rememberQuery('')` in their setup, as they reset `window.filterValue` today.
- [Enter in a field now saves in place instead of navigating.] → That's the intended change. It's covered by a unit test.

## Migration Plan

An ordinary tagged deploy. No data or route changes. The import map's `?v=` stamps fetch the new modules without a hard reload. Rollback: publish a release for the previous tag's commit.
