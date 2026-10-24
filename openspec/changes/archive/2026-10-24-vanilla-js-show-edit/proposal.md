# Proposal

## Why

Change 5 of the seven that replace jQuery. Changes 1 to 4 moved the filters, the details drawer, adding to the collection and movie edit into typed ES modules. Show edit comes next: the edit dialog for a show's episode, season and show, its arrows, Delete Episode, the artwork field and upload, setting the default season, and Create New Show. Its eight jQuery functions are the last borrowers of `window.drawer` and `window.preview`.

Findings on the way:
- **Switching tabs saves.** The dialog's click handler catches every button, the tabs included, so each tab switch sends a PUT of all four tab forms. Cancel after a tab switch undoes nothing.
- **OK closes the dialog before the server answers.** A failed save is silent.
- **The grid tile keeps the old poster after a save.** The line meant to update it targets `.lazy.active`, which nothing has matched since posters moved to `loading="lazy"`. Picking a season updates the tile, but with the full-size poster rather than the grid's thumbnail.
- **The drawer previews an unsaved poster.** It changes as soon as the poster field does, and keeps the new poster after Cancel.
- **The arrows append the reply array.** `$.when` hands each callback `[data, status, xhr]`, and the whole array is appended to the dialog.
- **Create New Show's OK posts without `new`.** The server then answers with nothing, so the grid doesn't show the episode it added.
- **The Create New Show button for a season with no episodes does nothing.** It is a submit button outside any form, and its id, `create-show`, is already the season-picker forms' id.
- **Create New Show reads the user id from `sessionStorage`.** Its fallback check, `$('.index-preview') > 0`, is always false. The route ignores the id anyway: it renders for the signed-in user.
- **The footer's episode count after adding or deleting an episode counts every user's episodes**, not the signed-in user's.

## What Changes

- **New module `public/js/mmdb/show-edit.js`**, typed with JSDoc and unit-tested first. It owns:
  - opening the edit dialog from the drawer's edit link
  - saving on OK and on the arrows, not on a tab switch; Cancel closes without saving
  - OK closing the dialog only once the save succeeds; a failed save shows an error line and keeps the dialog open
  - the arrows saving, then showing the previous or next episode
  - Delete Episode, with an error line when it fails
  - the poster field previewing in the dialog only; a successful save updates the drawer and the open grid tile
  - the artwork upload, as today
  - setting the default season from the drawer
  - Create New Show: opening it, "+" adding an episode, and OK adding a filled-in episode the same way, then closing
- **`PUT /users/:uid/shows/:id` answers `{ page, poster }`** instead of the bare details page. `poster` is the show's grid thumbnail. The default-season route's `poster` becomes the thumbnail too.
- **The add-episode and delete-episode routes count the signed-in user's episodes** for the footer.
- **Partials:**
  - `_edit_show.erb` and `_create_show.erb` gain the error line.
  - `_episodes_preview.erb`'s empty-season button becomes the search panel's Create New Show button.
- **Create New Show loads `/shows/new`**, so `sessionStorage` is no longer read for it.
- **`drawer.js` exports the open tile and `preview.js` already exports `close`**, so `window.drawer`, `window.preview` and `legacy.d.ts`'s entries for them go. Bootstrap's modal stays until change 7, reached through one typed declaration.
- **Removed from `mmdb.js`:** `createShow`, `displayCreateShow`, `seasonDefault`, `toggleActive`, `deleteEpisode`, `updatePoster`, `uploadArtwork`, `editShow`, `displayShowEditForm`, and their bindings.
- **Browser tests come first** for what isn't covered: saving and Cancel, the arrows, the grid tile after a poster change, a failed save, Delete Episode, Create New Show from a failed search and from an empty season.

Deferred: deleting a season's only episode leaves the dialog showing the deleted episode, and the next save fails. It needs a decision on what an empty season shows in the dialog.

## Capabilities

### New Capabilities

- `show-edit`: editing a show from its details drawer: the edit dialog and when it saves, moving between episodes, deleting an episode, the poster and its previews, setting the default season, and creating a new show.

### Modified Capabilities

- `adding-to-collection`: a season with no episodes offers a working Create New Show.

## Impact

- **New files:**
  - `public/js/mmdb/show-edit.js`, with `spec/js/show-edit.test.js`
  - `e2e/show_edit.spec.js`, for the new browser tests
- **Changed:**
  - `public/js/main.js`
  - `public/js/mmdb/drawer.js` and `preview.js`, with their tests: the export, and the `window` loans removed
  - `public/js/mmdb/request.js`, with its test: a failed request carries its body, and `fields()` leaves out files
  - `public/js/mmdb/legacy.d.ts`: `drawer` and `preview` removed, Bootstrap's `modal` declared
  - `public/js/mmdb.js`: about 170 lines removed
  - `app/controllers/users_shows_controller.rb`, `users_seasons_controller.rb`, `users_episodes.rb`: the `poster` and the episode counts
  - `app/views/partials/_edit_show.erb`, `_create_show.erb`, `_episodes_preview.erb`
  - `e2e/artwork.spec.js` and `shows.spec.js`, where they read what changes
- No data or CSS changes.
