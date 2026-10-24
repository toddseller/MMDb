# Tasks

## 1. Browser tests for what isn't covered yet

- [x] 1.1 Add `e2e/movie_edit.spec.js`, signed in on the movies page, reseeding after. Each test opens a movie's details, then its edit link. Each data-changing test has its own movie, and the filtered tests compare against the list the filter showed, so order doesn't matter (picking the result renames Edit Target):
  - **Only in the drawer:** the page holds exactly one `.edit-form`, inside the drawer.
  - **Picking a result:** with `/movies/update?*` answered from `movie_update_search.json`, Search, then picking the result, closes the panel and the form's title field shows the result's title.
  - **Quality:** with 1080 checked (Garnet), checking 4K leaves only 4K checked. Unchecking it leaves none checked.
  - **New survives a save:** for Cedar (seeded New), Update, then reopening the form, shows New still checked.
  - **Failed save:** with the `PUT` answered 500, Update shows "Couldn't save Birch. Try again.", the form keeps the edited plot, and the grid still has 30 posters.
  - **Failed delete:** with the `DELETE` answered 500, Delete shows "Couldn't delete Juniper. Try again.", the drawer stays open, and Juniper's poster is still in the grid.
  - **Filtered save:** with the title filter set to "target", saving Rate Target leaves the grid showing the same filtered list.
  - **Filtered delete:** with the title filter set to "Target", deleting Delete Target leaves the other "Target" movies and no Delete Target.
- [x] 1.2 Run them against today's code: picking a result, quality and both filtered tests pass. Only-in-the-drawer fails (a copy is in the sign-in modal), New fails (the save answers 500, so the form never leaves), and both failure tests fail (no line). Recorded: 4 failed, 4 passed, as described.

## 2. The list query moves into filters.js

- [x] 2.1 In `spec/js/filters.test.js` and `spec/js/credits.test.js`, replace the `window.filterValue` checks with `listQuery(document)`:
  - `{ filter: 'amb' }` after a title search for "amb"
  - `{ name: 'Ann Lee' }` after a credits click
  - `{ name: '' }` after Clear

  Show them failing (no export).
- [x] 2.2 Add `rememberQuery` and `listQuery` to `filters.js`, call `rememberQuery` from `credits.js`, and stop both from writing `window.filterValue`. Run `npm test` and `npm run typecheck`.

## 3. Exports for edit.js

- [x] 3.1 In `spec/js/preview.test.js`, replace the `window.preview` test with:
  - the exported `search(document, url, 'movies')` fills the panel
  - `close(document)` closes it
  - `window.preview` has only `close`

  In `spec/js/drawer.test.js`, change the `window.drawer` test to check that it exposes only `tile`. Show both failing.
- [x] 3.2 Export `search` and `close` from `preview.js`, with `close`'s duration defaulting to 300ms. Narrow `window.preview` to `{ close }` and `window.drawer` to `{ tile }`, and update `legacy.d.ts` to match (removing `filterValue`). Leave the jQuery callers on `window.preview.close` and `window.drawer.tile` alone. `tsc` doesn't check `mmdb.js`, and its movie-edit functions still call the members being removed until 4.4. So 3.2 lands together with group 4 in one commit, and only `npm test` and `npm run typecheck` are run here.

## 4. edit.js

- [x] 4.1 Write `spec/js/edit.test.js` and show it failing. It uses the drawer markup from `_info.erb`, the form from `_edit_movie.erb`, and the stars from `_ratings_form.erb`, with `fetch` stubbed. It checks:
  - **Edit link:** the drawer's `.modal-body` is replaced by the form, a second `.modal-body` outside the drawer is untouched, and an open search panel closes.
  - **Update:** `PUT`s the form's fields plus `listQuery`, closes and reopens the drawer at once on the tile holding `.movie-modal[id="<id>"]`, with the new grid. Enter in a field (a `submit` event) does the same. A tile whose id equals the movie id is not chosen.
  - **Delete:** `DELETE`s to the delete form's action with `listQuery`. The drawer stays open until the reply, then closes, and the grid and "N Movies" footer update.
  - **Failures:** a failed save or delete shows the error line with the stored title as text, leaves the drawer and grid alone, and hides the line again on the next attempt.
  - **Search:** requests `/movies/update?title=<stored title>&route=<form action>` into the panel, even after the title field is edited.
  - **Picking a result:** `PUT`s the result's form, closes the panel and puts the returned form in the drawer. On failure, the panel stays open and the line shows.
  - **Quality:** checking one quality checkbox unchecks the others with the same name.
  - **Stars:** a change on a star `POST`s `rating=<n>` to the form's action and replaces `#ratings-container`, with no inline styles set.
- [x] 4.2 Write `public/js/mmdb/edit.js` and call its `init` from `main.js`. Run `npm test` and `npm run typecheck`.
- [x] 4.3 In `_edit_movie.erb`:
  - fix the `movie[isnew` name
  - set `#delete-form`'s action to `/users/<user id>/movies/<movie id>`
  - add the hidden error line under the buttons

  `bundle exec rspec` still passes.
- [x] 4.4 In `mmdb.js`, remove `editMovie`, `displayEditForm`, `submitUpdate`, `submitPreviewUpdate`, `displayUpdatedMovie`, `deleteMovie`, `updateDatabase`, `ratingSubmit`, `toggleHD`, the `filterValue` variable and comment, and their seven bindings (`displayEditForm` and `displayUpdatedMovie` were only callbacks).
- [x] 4.5 In `e2e/edit_rate.spec.js`, drop the `:visible` workaround and its comment. Run every browser test: group 1's now all pass, along with `edit_rate`, `delete`, `adding` (the edit form's search) and `shows` (the season default still reads `window.drawer.tile`).

## 5. Check and finish

- [x] 5.1 Break checks: in `edit.js`, disable in turn the update submit, the delete submit, the error line, the result pick, the quality toggle and the star change. Confirm a browser test fails each time.
- [x] 5.2 Run the full suite: `bundle exec rspec`, `npm test`, `npm run typecheck` and `npx playwright test`.
- [x] 5.3 In the README's list of browser-tested flows, extend "editing and rating" to name refreshing from a search, the quality and New flags, failed saves and deletes, and editing while filtered. Confirm the list still matches the files in `e2e/`.
- [x] 5.4 Run `openspec validate vanilla-js-movie-edit --strict`.

## Workflow follow-up

- Work on the `vanilla-js-movie-edit` branch. Run `/ponytail:ponytail-review` on the diff before the first commit. Archive as the change PR's last commit, then open the PR with gh.
- After the merge, the user deploys with the next tag from `gh release list`. Then validate on mmdb.online without changing data: open a movie's edit form and check it appears only in the drawer, open the form's Search and dismiss it, and toggle the quality checkboxes without saving.
- Update the jQuery rewrite memory: change 4 done; the failed-add "Adding…" leftover can reuse the error-line pattern.
