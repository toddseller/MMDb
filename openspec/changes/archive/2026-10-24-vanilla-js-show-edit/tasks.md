# Tasks

## 1. Browser tests for what isn't covered yet

- [x] 1.1 In `e2e/seed.rb`:
  - add a second show, Tide Tables, with one active season of three episodes ("Tide Tables 1x1" to "1x3"), for the tests that change episodes; Harbor Lights stays as the existing tests expect
  - record `show_episodes_empty.json`: the season pick answered with `Show.get_episodes` returning no episodes

  `npx playwright test e2e/shows.spec.js` still passes.
- [x] 1.2 Add `e2e/show_edit.spec.js`, signed in on the shows page, reseeding after. Each test opens Tide Tables' drawer, then its edit link, unless it says otherwise:
  - **Tabs don't save:** no `PUT` is sent while switching through all four tabs.
  - **Cancel cancels:** edit the episode title, switch to Sorting, Cancel; reopening shows "Tide Tables 1x1".
  - **OK saves:** rename the show on Sorting, OK; the dialog closes once saved and the drawer shows the new title.
  - **Failed save:** with the `PUT` answered 500, OK keeps the dialog open with the edited title and shows "Couldn't save Tide Tables. Try again."
  - **Arrows:** edit 1x1's title, press the right arrow; the dialog shows 1x2, and the left arrow back shows the edited title. On 1x1 the left arrow is disabled.
  - **Poster on save:** paste a new poster URL on Artwork, OK; the drawer and the grid tile show it at thumbnail size (`400x400`) without a reload.
  - **Poster on Cancel:** paste a new poster URL, Cancel; the drawer and the tile keep the old poster.
  - **Delete Episode:** delete 1x1; the dialog shows 1x2 and the footer's episode count drops by one. With the `DELETE` answered 500, the dialog keeps 1x1 and shows "Couldn't delete Tide Tables 1x1. Try again."
  - **Create New Show:** from a failed show search, Create New Show; fill in the show, season and an episode, "+", a second episode, OK; the dialog closes and the new show's drawer lists both episodes. OK on the blank form after "+" adds no untitled episode.
  - **Empty season:** with the season pick answered from `show_episodes_empty.json`, the panel's Create New Show opens the dialog.
- [x] 1.3 Run them against today's code and record which fail and why. Recorded: 8 failed, 4 passed. Failed: tabs don't save (6 PUTs on four tab clicks), Cancel cancels (a tab switch had saved "Not Saved"), failed save and failed delete (no line), arrows (the reply array shows "success" in the dialog), poster on save (the tile keeps the old poster), poster on Cancel (the drawer keeps the cancelled one), empty season (the button does nothing). Passed: OK saves, Delete Episode, and both Create New Show tests, since the grid tile comes from the "+" reply and the server already refuses an untitled episode. The Create New Show tests reseed after each, because the server finds a hand-made show by its blank collection id.

## 2. The routes' answers and counts

- [x] 2.1 Add to `spec/` (next to `artwork_upload_spec.rb`'s show edit modal examples) request specs, and show them failing:
  - `PUT /users/:uid/shows/:id` (XHR) answers `{ page, poster }`, `poster` being the show's thumbnail URL
  - `POST /users/:uid/shows/:sid/seasons/:n` answers the thumbnail as `poster`
  - adding an episode and deleting one answer the signed-in user's episode count, not every user's
  - `_episodes_preview.erb` with no episodes renders a `type="button"` `#create-new`, and no `#create-show` outside the season forms
  - `_edit_show.erb` and `_create_show.erb` render a hidden `role="alert"` `.edit-error`
- [x] 2.2 Change `users_shows_controller.rb`, `users_seasons_controller.rb`, `users_episodes.rb` and the three partials to match. Run `bundle exec rspec`.

## 3. Shared pieces for show-edit.js

- [x] 3.1 In `spec/js/drawer.test.js`, replace the `window.drawer` test with: `openTile()` returns the open tile, and `null` once closed; `window.drawer` is gone. In `spec/js/request.test.js`, add: a failed request's error carries the response text as `body`. Show both failing.
- [x] 3.2 Export `openTile()` from `drawer.js` and drop its `window.drawer`; add `body` to `request()`'s error. Like change 4's 3.2, this lands with group 4 in one commit, because the jQuery season default reads `window.drawer` until 4.4. Run `npm test` and `npm run typecheck`.

## 4. show-edit.js

- [x] 4.1 Write `spec/js/show-edit.test.js` from the markup of `_show_info.erb`, `_edit_show.erb`, `_create_show.erb` and `_new_episode.erb`, with `fetch` and `window.$` stubbed, and show it failing. It checks:
  - **Edit link:** `GET`s the link and shows the reply in `#edit-show` through `modal('show')`.
  - **Tabs:** a tab click moves `active` to it and sends nothing.
  - **OK:** `PUT`s every `.show-data` form plus `show[poster]` and `form[id]`; on success the drawer's `.info-wrapper` gets `page`, the open tile's `img` gets `poster`, then `modal('hide')`. On failure the line shows the stored title as text and the dialog stays.
  - **Cancel:** `modal('hide')` with no request.
  - **Arrows:** save, then `GET` the arrow's `href` into `#edit-show`; a failed save sends no `GET`.
  - **Delete Episode:** `DELETE`s the button's `href`; shows `page` and writes the show and episode counts to the footer as text, in today's "N TV Shows &#8212; M Episodes" form; a failure shows the line with the episode's stored title.
  - **Poster field:** a `change` sets the dialog's header and Artwork images only.
  - **Upload:** posts the file to `data-upload`, fills the field and fires `change`; a failure shows the server's `error`, or the fallback when the body isn't JSON; the input is cleared either way.
  - **Season button:** `POST`s to the form's action plus the season number, fills `.info-wrapper` with `page` and the tile's `img` with `poster`.
  - **Create New Show:** `#create-new` closes the search panel and `GET`s `/shows/new` into the dialog. "+" `POST`s to `/shows` with `new=true`, puts `form` in `#episode`, `page` in `#show-list`, and "Season 1, 2 episodes added" (or "1 episode added") in the header. OK does the same then hides, or just hides with no episode title.
- [x] 4.2 Write `public/js/mmdb/show-edit.js` and call its `init` from `main.js`. In `legacy.d.ts`, remove `drawer` and `preview` and declare `$` with only `modal`. Drop `window.preview` from `preview.js` and its test. Run `npm test` and `npm run typecheck`.
- [x] 4.3 In `mmdb.js`, remove `createShow`, `displayCreateShow`, `seasonDefault`, `toggleActive`, `deleteEpisode`, `updatePoster`, `uploadArtwork`, `editShow`, `displayShowEditForm` and their eight bindings.
- [x] 4.4 Update `e2e/artwork.spec.js` and `shows.spec.js` only where they read what changed, then run every browser test: group 1's now all pass, along with `artwork`, `shows`, `modals_tabs` and `adding`. Neither file needed a change; all 55 browser tests pass.

## 5. Check and finish

- [x] 5.1 Break checks: in `show-edit.js`, disable in turn OK's save, Cancel, the arrows' save, the tile poster update, the error line, Delete Episode, "+", and the `#create-new` binding. Confirm a browser test fails each time.
- [x] 5.2 Run the full suite: `bundle exec rspec`, `npm test`, `npm run typecheck` and `npx playwright test`.
- [x] 5.3 In the README's list of browser-tested flows, add show editing (saving and Cancel, the arrows, the poster, a failed save, Delete Episode, Create New Show). Confirm the list still matches the files in `e2e/`.
- [x] 5.4 Run `openspec validate vanilla-js-show-edit --strict`.

## Workflow follow-up

- Work on the `vanilla-js-show-edit` branch. Run `/ponytail:ponytail-review` on the diff before the first commit. Archive as the change PR's last commit, then open the PR with gh.
- After the merge, the user deploys with the next tag from `gh release list`. Then validate on mmdb.online without changing data: open a show's edit dialog, switch tabs, step through episodes with the arrows only if nothing was edited, preview a poster URL and Cancel, and open Create New Show and Cancel.
- Update the jQuery rewrite memory: change 5 done; deleting a season's only episode is still open.
