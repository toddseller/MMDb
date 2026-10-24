# Tasks

## 1. Browser tests for what changes

- [x] 1.1 Add `e2e/dialogs.spec.js`:
  - **Escape fades out:** open sign-in, press Escape; straight after the key the dialog is still open, then it is hidden.
  - **Reduced motion:** with `page.emulateMedia({ reducedMotion: 'reduce' })`, Escape closes sign-in at once (`open` is false straight after the key).
  - **Escape clears sign-in:** type into sign-in, Escape, reopen; the fields are empty and the error line hidden.
  - **Focus returns:** focus Sign in with the keyboard, Enter, Escape; Sign in has focus.
  - **Click outside:** open a home page poster's dialog, click the backdrop at the viewport's corner; the dialog stays open.
  - **× closes:** the movie dialog's × button closes it.
  - **No scroll behind:** on the 30-movie collection, open a movie's details dialog from a page that scrolls, then scroll the wheel; `scrollY` is unchanged.
  - **Tab never reaches the page behind:** with sign-in open, ten Tabs and ten Shift+Tabs never focus a page control outside the dialog (the body, the browser's own toolbar, is allowed).
- [x] 1.2 In `e2e/show_edit.spec.js`, add the spec's Enter scenarios:
  - Enter in the episode number saves and closes, and the URL is unchanged.
  - Enter in a single-line field of Create New Show adds the show with its titled episode.
  - With the save answered by a 500, Enter keeps the dialog open with the error line.
- [x] 1.3 In `e2e/smoke.spec.js`, replace the jQuery version check with `window.jQuery` being undefined and no request to `ajax.googleapis.com`.
- [x] 1.4 Run groups 1.1 to 1.3 against today's code and record in this task which fail and why. Expected to fail: the fade-out and reduced-motion tests (today's dialogs are `div`s with no `open`), the three Enter tests (the page navigates) and the smoke test (jQuery is loaded). Expected to pass, as behavior this change keeps: click outside, ×, no scroll behind, and Escape clearing sign-in. Focus return and Tab containment depend on Bootstrap's focus handling, so record what they do. Recorded: 8 failed, 16 passed. Failed: fade-out and reduced motion (`open` is undefined on a `div`), focus return (with focus left on the button behind, Bootstrap's Escape handler on the modal never runs, so the dialog stays open), Tab containment (focus rests on the body past the last control; the test was wrong to count that, since in a real window it is the browser's toolbar, so it was rewritten to allow the body and to Shift+Tab as well, and then passes on today's code too: Bootstrap's focus guard keeps focus off the page), the three Enter tests (the browser posts the form and lands on `/users/1/shows/2`), and the smoke test. Passed: Escape clearing sign-in, no scroll behind (run with sign-in over the signed-out 30-movie collection, since the home page doesn't scroll and `#movie` only opens there), the click beside the dialog, and the × button.

## 2. dialog.js

- [x] 2.1 In `spec/js/dom.js`, add `stubDialogs(window)`. It gives `HTMLDialogElement.prototype` a `showModal` that sets `open` and a `close` that clears `open` and dispatches `close`. It gives each dialog a `getAnimations({ subtree })` that returns the animations a test hands it, empty by default. Type-check with `npm run typecheck`.
- [x] 2.2 Write `spec/js/dialog.test.js` and show it failing:
  - `open(document, id)` opens the dialog modally.
  - `close(document, id)` adds `closing` and leaves the dialog open until its pending animations settle, then closes it and clears `closing`.
  - With no animations, `close` closes at once.
  - A cancelled animation still lets the close finish.
  - Opening during a pending close removes `closing`, and the dialog stays open once the old animations settle.
  - A `cancel` event on a `dialog.modal` is prevented and starts the same close.
  - A click on a `[data-close]` element closes its dialog.
  - A native close (no `closing` step) still clears `closing`.
- [x] 2.3 Write `public/js/mmdb/dialog.js` (`open`, `close`, `init`) and call `init` first from `main.js`. Run `npm test` and `npm run typecheck`.

## 3. The dialogs move to `<dialog>`

- [x] 3.1 Update `spec/js/account.test.js`, `navigation.test.js` and `show-edit.test.js`. Use `<dialog class="modal">` markup and `stubDialogs` in place of the `window.$` fake, assert on `open`, and await closes. For account: the Sign in button opens `logIn`; the `close` event on `#logIn` resets the form, hides the line and restores the theme; the autofocus test goes. Show them failing.
- [x] 3.2 Switch `account.js`, `navigation.js` and `show-edit.js` to `dialog.js`:
  - the Sign in button's click in `account.js`
  - `close` on `#logIn`
  - the shown handler removed
  - Cancel and every close in `show-edit.js`

  Delete `public/js/mmdb/bootstrap.js`, `public/js/mmdb/legacy.d.ts` and `spec/js/bootstrap.test.js`. Run `npm test` and `npm run typecheck`.
- [x] 3.3 In `layout.erb`:
  - `#logIn`, `#movie` and `#edit-show` become `<dialog class="modal">`, without `fade`, `role` or `tabindex`
  - the Sign in button gets `id="open-sign-in"` and loses `data-toggle`/`data-target`

  In `layout.erb`, `_modal.erb`, `_preview_modal.erb` and `_edit_user.erb`, `data-dismiss="modal"` becomes `data-close`.
- [x] 3.4 Add `public/css/dialog.css` without the fade: `dialog.modal[open]` shown, resets for the dialog defaults (border, padding, margin, background, color, max-width, max-height), `::backdrop` black at 0.5, and `body:has(dialog.modal[open])` not scrolling. Import it as `dialog.css?v=1` from `default.css` and `dark.css`. Run every browser test: all but the fade-out test pass, and so do the existing account, navigation, show-edit and tab tests.
- [x] 3.5 Screenshot sign-in, Account Settings, a movie's details (signed-in drawer page and home page) and show edit, in the light and dark themes at 1500x900, and compare with the same dialogs on mmdb.online. Fix any difference in `dialog.css` and record the result in this task. Recorded: compared with the same script run on `master` (the code mmdb.online runs, v2026.10.24.13) at 1512x785, which gives the same data and covers the signed-in dialogs; Chrome's zoomed-out window made mmdb.online's own shots incomparable. A pixel diff of all eight pairs found no layout change. The only differences: the movie dialog's × is darker because `<dialog>` focuses it (Bootstrap focused the box itself, and `.close:focus` raises its opacity), the drawer's "…" button behind show edit no longer keeps its focus ring, and the grid's animated loading circles behind the dialogs were caught on different frames. Nothing to fix.

## 4. Show edit's tabs and Enter

- [x] 4.1 In `spec/js/show-edit.test.js`, use `data-tab` on the tab buttons, and show these failing:
  - clicking a tab shows its pane, hides the others and highlights the tab
  - Enter in a dialog text input is prevented and runs OK, in edit and in create mode; Enter in a textarea or while composing is left alone (keydown, not submit: forms with several text fields never submit on Enter, see design)
- [x] 4.2 In `_edit_show.erb` and `_create_show.erb`, `data-toggle="tab"` becomes `data-tab`. In `show-edit.js`, the tab handler switches the pane, and a `keydown` handler for Enter on `#edit-show` text inputs calls OK. Run `npm test`, `npm run typecheck`, `e2e/show_edit.spec.js` and `e2e/modals_tabs.spec.js`; the Enter tests now pass.

## 5. The fade

- [x] 5.1 In `dialog.css`, inside `@media (prefers-reduced-motion: no-preference)`:
  - transitions on the dialog's opacity (.15s linear), `.modal-dialog`'s transform (.3s ease-out) and `::backdrop`'s opacity (.15s)
  - `@starting-style` for the open start
  - `dialog.modal.closing` for the end

  Raise the import to `dialog.css?v=2`. Run `e2e/dialogs.spec.js`: the fade-out and reduced-motion tests pass.
- [x] 5.2 Watch each dialog open and close in Chromium at full speed and with reduced motion. The fade and slide should match Bootstrap's on mmdb.online. Record the result here. Recorded: measured rather than watched. Sampling every 50ms on `master` (Bootstrap) and on this branch showed the same opacities, slide distance and timings, but Bootstrap runs the layers in sequence (backdrop then box on open, box then backdrop on close) where the first version ran them together. `transition-delay` now copies the sequence, and the resampled curves match Bootstrap's. The samples also showed show edit (no `.modal-dialog`) cutting off its backdrop's fade, so the close now also waits for the `::backdrop` (see design). With reduced motion, show edit opens at full opacity with no animations and closes straight away.

## 6. Remove jQuery and Bootstrap's JavaScript

- [x] 6.1 Remove the jQuery and `bootstrap.min.js` `<script>` tags from `layout.erb`. Delete `public/js/bootstrap.min.js`, `public/js/bootstrap.js`, `public/js/npm.js`, `e2e/vendor/jquery.min.js` and the jQuery route and its comment in `e2e/fixtures.js`. In `spec/page_assets_spec.rb`, expect 2 versioned assets. Run `bundle exec rspec` and `npx playwright test`; the smoke test now passes.
- [x] 6.2 In `README.md`:
  - the browser-test notes no longer serve jQuery from `e2e/vendor/`
  - the front-end notes no longer mention the jQuery rewrite in progress, `bootstrap.js` or `legacy.d.ts`, and say how dialogs open and close through `dialog.js`
  - the list of browser-tested flows adds the dialogs and Enter in show edit

  Confirm the list matches the files in `e2e/`.

## 7. Check and finish

- [x] 7.1 Break checks. In turn: let Escape close natively (drop the `cancel` prevention), call the browser's `close()` without waiting, drop the reopen guard, close on a backdrop click, drop the pane switch, drop the Enter handler's `preventDefault`, and drop the scroll lock. Confirm a browser or unit test fails each time. Recorded: all seven caught. Escape closing natively: "Escape is held for the fade-out" (unit) and "Escape fades the dialog out before it closes" (browser). Not waiting: four unit tests. No reopen guard: "opening during the fade-out keeps the dialog open". Backdrop click closing: "a click beside a dialog leaves it open". No pane switch: the tab unit test. Enter's `preventDefault` dropped: both Enter unit tests. No scroll lock: "the page behind does not scroll".
- [x] 7.2 Confirm by grep that only `dialog.js` calls `showModal` or `.close()` on a dialog, and that nothing under `app/views`, `public/js` or `e2e` mentions `jQuery`, `data-toggle` or `data-dismiss` except comments describing history.
- [x] 7.3 Run the full suite: `bundle exec rspec`, `npm test`, `npm run typecheck` and `npx playwright test`.
- [x] 7.4 Run `openspec validate vanilla-js-remove-jquery --strict`.

## Workflow follow-up

- Work on the `vanilla-js-remove-jquery` branch. Run `/ponytail:ponytail-review` on the diff before the first commit. Archive as the change PR's last commit, then open the PR with gh.
- After the merge, the user deploys with the next tag from `gh release list`. Then validate on mmdb.online without changing data:
  - the served files match the tag, and the page loads no jQuery
  - open and close sign-in with Escape and ×
  - preview a home page poster and click beside it
  - open Account Settings, flip the theme and close without Update
  - open show edit and Cancel
  - repeat the opens and closes in Safari, which e2e doesn't cover
- Update the jQuery rewrite memory: all seven changes done. Remaining follow-ups: a season's only episode being deleted, "Adding…" after a failed add, responsive layout.
