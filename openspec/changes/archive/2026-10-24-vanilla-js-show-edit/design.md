# Design

## Context

Show edit is nine functions in `public/js/mmdb.js`, bound on `#user-page` and `#edit-show`. The markup is `_show_info.erb` (the drawer: the edit link and the season buttons), `_edit_show.erb` (the edit dialog), `_create_show.erb` with `_new_episode.erb` (Create New Show), and `_episodes_preview.erb` (the empty-season button). The dialog is the layout's `#edit-show`, a Bootstrap modal whose content each open replaces wholesale. Its styles all hang off `#edit-show`, so that keeps working.

The routes:

| Action | Request | Answer today |
| --- | --- | --- |
| Open the dialog | `GET /users/:uid/shows/:id/edit` | JSON string: the dialog |
| Save | `PUT /users/:uid/shows/:id` with all four tab forms, `show[poster]` and `form[id]` | JSON string: the drawer's details |
| Another episode | `GET /users/:uid/shows/:sid/seasons/:seid/episodes/:id/edit` | JSON string: the dialog |
| Delete Episode | `DELETE /users/:uid/shows/:sid/seasons/:seid/episodes/:id` | `{ page, show_count, episode_count }` |
| Upload artwork | `POST /users/:uid/shows/:id/artwork` with the file | `{ url }`, or `{ error }` with 401, 422 or 502 |
| Default season | `POST /users/:uid/shows/:sid/seasons/:n` | `{ page, poster }` |
| Create New Show | `GET /shows/new` | `{ page }`: the dialog |
| "+" | `POST /shows` with the three forms and `new=true` | `{ page, form, season, count }`: grid, blank episode form |

Module conventions from changes 1 to 4 apply: `// @ts-check` with JSDoc, `#mmdb/` imports, `on()` delegation bound on `document`, `request()` and `fields()`, `init(document)` called from `main.js`, and change 4's error line.

## Goals / Non-Goals

**Goals:**
- Show edit looks and behaves as today, apart from the fixes the proposal names.
- Nothing in show edit reads `window`, except Bootstrap's modal.

**Non-Goals:**
- Replacing the Bootstrap modal or tabs. That is change 7.
- A confirmation for Delete Episode.
- Deleting a season's only episode (deferred, see the proposal).
- The duplicate ids in the partials (`id="season"` on both the Season pane and its input, `episode_title` twice in Create New Show). Bootstrap's tab lookup finds the pane first, as today; they belong with a markup clean-up.
- Errors for a failed dialog open or a failed default-season click. Both stay silent, as today.

## Decisions

**One module, `show-edit.js`.** Editing, the default season and Create New Show share the dialog, the save body and the error line. Alternative: put the default season in `drawer.js`. Rejected for the reason change 4 gave for the stars: `drawer.js` places and animates the drawer, it doesn't own what's in it.

**Bootstrap's modal through one typed declaration.** `legacy.d.ts` declares `$` on `window` with only `(selector) => { modal(action: 'show' | 'hide'): void }`, and the module calls it in one helper. Change 7 deletes both. Alternative: `<dialog>` now. Rejected in exploration: the sign-in and profile modals would still be Bootstrap until change 7.

**Each control is bound by its own selector.** `#edit-show #ok`, `#cancel`, `.edit-next`, `#add-new-episode` and `#episode-delete` each get a click handler, instead of one handler for every button that sorts them by text. That is what stops tab clicks from saving.

**The tabs keep their highlight in the module.** Bootstrap 3's tab plugin switches the panes from the buttons' `href`, but only moves `active` on `<li>` parents, which these buttons don't have. The jQuery catch-all moved it on the button. The module keeps that one line, bound to `#edit-show [data-toggle="tab"]`, and sends nothing.

**One save body.** Every `.show-data` form in the dialog, through `fields()`, which now leaves out file inputs as jQuery's `serialize` did (the Artwork form holds the upload's), plus `show[poster]` copied from `season[poster]` and `form[id]` from the Details form's id, as today. Edit saves `PUT` it to the form's action. Create New Show `POST`s it to `/shows` with `new=true`.

**OK and the arrows wait for the save.** OK closes the dialog only after the save answers. The arrows save first and fetch the other episode only once the save succeeds, so a failed save keeps the current episode. Today both requests go out at once and the reply array is appended. Alternative: keep them parallel. Rejected: the next episode could render before a save that then fails, and the episode it failed for would be gone.

**The save answers `{ page, poster }`.** `page` replaces the drawer's `.info-wrapper` content, as today. `poster` is `show.thumbnail` and goes on the open tile's `img`. The default-season route's `poster` becomes `show.thumbnail` too, so both paths put the grid-sized image on the tile. Alternative: rewrite the URL to its thumbnail in JS. Rejected: `Show#thumbnail` would then have a copy that can drift.

**`drawer.js` exports `openTile()`.** It returns the open tile, replacing the `window.drawer` getter. The default season and the save use it. `preview.js` already exports `close`, which Create New Show imports, so `window.preview` goes too.

**The poster field previews in the dialog only.** A `change` on `season[poster]` sets the dialog's header poster and the Artwork tab's image. The drawer and tile lines go: the save's reply updates them. The line that also copied the title field into the header goes too: the dialog closes on OK and the arrows re-render it with the saved title.

**The error line is in the partials.** `<p class="edit-error text-danger" role="alert" hidden>` sits in the footer of `_edit_show.erb` and `_create_show.erb`. Its text is set with `textContent`:
- Save and the arrows: "Couldn't save <title>. Try again.", with the show title field's `defaultValue`, the stored title.
- Delete Episode: "Couldn't delete <title>. Try again.", with the episode title field's `defaultValue`.
- Create New Show's "+" and OK: "Couldn't save <title>. Try again.", with the typed show title, since nothing is stored yet.

Each attempt hides the line first, as in change 4.

**A failed request carries its body.** `request()` throws on a non-2xx answer with only the status. The upload has to show the server's `{ error }` message, so the thrown error gets a `body` property holding the response text. The upload parses it, and falls back to today's message when it isn't JSON. Alternative: call `fetch` directly in the upload. Rejected: it would repeat `request()`'s headers and credentials.

**Create New Show.** `#create-new` clicks, from the search panel and now the empty-season button, close the search panel, `GET /shows/new` and open the dialog. "+" posts the save body and shows the reply: the blank episode form in `#episode`, the grid in `#show-list`, and "Season <n>, <count> episode(s) added" in the header. OK makes the same request and also closes, but only when the Episode tab's title has text. Without one it just closes: the server rejects an untitled episode, and "+" has already saved the rest.

**The empty-season button is the search panel's button.** `_episodes_preview.erb` renders `<button type="button" id="create-new" class="add-all">`, matching `preview.js`'s `CREATE_NEW_SHOW`. That frees the `create-show` id for the season-picker forms.

**The episode counts use `Episode.episode_count(user.id)`.** The add-episode and delete-episode routes counted `Episode.all`. The collection page already uses the per-user helper.

## Risks / Trade-offs

- [The save's answer changes from a string to `{ page, poster }`.] → The jQuery code that read it is deleted in the same change, and nothing else calls the route. The myflix app uses the API routes, not this one.
- [OK now waits on the network before closing.] → That is the intended change. A slow save leaves the dialog up a moment longer, with the error line if it fails.
- [Bootstrap's modal still runs on jQuery.] → Limited to one declared helper, which change 7 deletes.
- [Tab switches no longer save.] → All four tab forms stay in the page, so nothing typed is lost. The drawer behind the dialog now updates on OK or an arrow instead of on each tab click.

## Migration Plan

An ordinary tagged deploy. No data changes. The routes' new answers and the module ship together, and the import map's `?v=` stamps fetch the new modules. Rollback: publish a release for the previous tag's commit.
