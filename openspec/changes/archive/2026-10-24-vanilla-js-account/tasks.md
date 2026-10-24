# Tasks

## 1. Browser tests for what isn't covered yet

- [x] 1.1 In `e2e/seed.rb`, add a second user, Olive Other (`other@example.test`), owning one new movie and one new show with one active season of two episodes, none shared with user 1. Export their id from `e2e/fixtures.js` as `OTHER`. `npx playwright test` still passes with the same counts.
- [x] 1.2 Add `e2e/navigation.spec.js`. Each switch test counts the requests to the switch's URL and expects exactly one, and reads the footer:
  - **Menu, movies to shows:** signed in on `/users/1`, menu, Profile, TV Shows; the show grid shows Harbor Lights, the menu is closed, the footer reads user 1's show and episode counts with the em dash.
  - **Menu, shows to movies:** signed in on `/users/1/shows`, menu, Profile, Movies; the movie grid is back, the menu is closed, the footer reads "30 Movies".
  - **In-page, movies to shows:** signed in on Olive's movies, the TV Shows button; Olive's show is listed and the footer reads "1 TV Shows", the em dash, "2 Episodes".
  - **In-page, shows to movies:** signed in on Olive's shows, the Movies button; Olive's movie is listed and the footer reads "1 Movies".
  - **Menu:** Profile opens the submenu; the menu button closes both, and reopening shows the submenu closed with its triangle unturned. Move the existing menu test here from `modals_tabs.spec.js`.
  - **Home poster:** on `/`, clicking the first Most Popular poster opens a dialog with that movie's title, and the URL is still `/`.
- [x] 1.3 Add `e2e/account.spec.js`, reseeding after the tests that save. Move the sign-in and theme tests here from `modals_tabs.spec.js`, then add:
  - **Autofocus:** opening the sign-in dialog focuses the user name or email field.
  - **Refused sign-in:** a wrong password shows the error line and empties both fields; an empty submit sends no `POST /sessions`; closing and reopening shows empty fields and no error.
  - **Sign Out:** menu, Sign Out; the page is `/` with the Sign in button.
  - **Name change by Enter:** change the first name, press Enter in it; the dialog closes and the navbar reads "Signed in as" the new name.
  - **Wrong current password:** type a wrong current password, a new one and its match, Update; "Invalid Password." shows, the current field is empty and focused, new and confirm are empty and disabled, Update is enabled.
  - **Right current password:** current `e2e-password`, new and confirm `e2e-password`; the dialog closes.
  - **Theme on close:** flip the switch, close the dialog; the page is light again and has one theme stylesheet.
  - **Theme saved:** flip the switch, Update, reload; dark. Then flip it off, Update, reload; light.
  - **Registration:** on `/users/new`, a mismatched confirmation shows "Passwords do not match" with Register disabled after the pause; fixing it hides the line and enables Register. Nothing is submitted.
- [x] 1.4 Run groups 1.2 and 1.3 against today's code and record in this task which fail and why. Recorded: 6 failed, 17 passed. Failed: both menu switches (2 requests each, from the direct and the delegated binding), the menu triangle (left `active`), the theme switch and theme on close (a second stylesheet per flip, and the dark one stays after close), and the saved theme (the light theme loads dark after a reload). Passed: the in-page switches (jQuery's direct binding lands on the menu's `#user-shows`, the first with that id, so the page's button only has the delegated one), the menu, the home poster, every sign-in test, Sign Out, the registration check (its missing debounce only shows in timing, so the unit test covers it), Enter saving (the browser clicks the default button), and the wrong password (the matching confirm had already enabled Update, so the proposal's finding that it stayed disabled was wrong and is removed).

## 2. The saved theme and the theme link

- [x] 2.1 Add request specs to `spec/views_spec.rb` (or a new `spec/account_spec.rb`), and show them failing:
  - `PUT /users/:id` without `theme` stores `default`, and with `theme=dark` stores `dark`, with or without a current password
  - every page's theme `<link>` has `id="theme"`, an `href` for the session's theme, and `data-default` and `data-dark` holding the two versioned URLs
- [x] 2.2 Change `users_controller.rb` and `layout.erb` to match. Run `bundle exec rspec`.

## 3. bootstrap.js

- [x] 3.1 Write `spec/js/bootstrap.test.js` with `window.$` stubbed, and show it failing: `modal(document, selector, action)` calls `$(selector).modal(action)`; `onModal(document, selector, event, handler)` registers through `$(selector).on(event, …)` and calls `handler` with the shown element.
- [x] 3.2 Write `public/js/mmdb/bootstrap.js`, switch `show-edit.js` to its `modal`, and declare only `modal` and `on` for the two events in `legacy.d.ts`. Run `npm test` and `npm run typecheck`; `e2e/show_edit.spec.js` still passes.

## 4. navigation.js

- [x] 4.1 Write `spec/js/navigation.test.js` from the layout's menu and the two collection pages' markup, with `fetch` and `window.$` stubbed, and show it failing. It checks:
  - **Menu button:** toggles `active` on `#nav-toggle` and `#drop-down`; closing also clears the submenu and the triangle.
  - **Profile:** toggles the submenu and the triangle.
  - **Switch:** one click sends one `GET` to the link's `href`, puts `page` in `#user-page`, writes "N Movies" or the shows line as text, and closes the menu; links inside the new page work the same.
  - **Home poster:** `GET`s the poster link's `href` into `#movie .modal-content` and shows `#movie`.
- [x] 4.2 Write `public/js/mmdb/navigation.js`, exporting `closeMenu`, and call its `init` from `main.js`. Remove `animateMenu`, `toggleProfile`, `getUser`, `activateModal`, `displayMovieModal`, `openMenu`, `closeMenu`, `goToProfile` and their bindings from `mmdb.js`. Run `npm test`, `npm run typecheck`, and `e2e/navigation.spec.js`, which now passes.

## 5. account.js

- [x] 5.1 Write `spec/js/account.test.js` from the layout's `#logIn`, `_edit_user.erb` and `users/new.erb` markup, with `fetch`, `window.$` and the timers stubbed, and show it failing. It checks:
  - **Sign-in:** an empty submit shows the line and sends nothing; a refusal shows it and resets the form; success replaces the location with `/users/<id>`.
  - **Closing `#logIn`:** resets the sign-in form, hides the line, restores the saved theme `href`.
  - **Autofocus:** a shown modal focuses its `[autofocus]` field.
  - **Sign Out:** `POST`s `/sessions/<href>`, then replaces the location with `/`.
  - **Account Settings:** `#update` `GET`s its `href` into `#logIn .modal-content`, shows `#logIn` and closes the menu.
  - **Password fields:** a current password disables Update and enables new and confirm; clearing it enables Update; a matching confirm enables Update, a mismatch disables it.
  - **Save:** `submit` `PUT`s the form's fields to its action; success hides `#logIn`, writes "Signed in as <name>" as text and keeps the shown theme as saved; a refusal shows the line, clears and focuses current, clears and disables new and confirm, and enables Update.
  - **Theme switch:** sets the theme link's `href` from `data-dark` or `data-default`; the head keeps one theme link.
  - **Registration:** several inputs within 1.5 seconds run one check; a mismatch shows "Passwords do not match" and disables Register; a match hides it and enables Register.
- [x] 5.2 Write `public/js/mmdb/account.js` and call its `init` from `main.js`. Delete `public/js/mmdb.js` and `public/js/application.js` and their `<script>` tags in `layout.erb`. Run `npm test`, `npm run typecheck`, and every browser test: groups 1.2 and 1.3 now all pass, along with the rest. Also updated: `spec/page_assets_spec.rb` (three versioned assets, `main.js` for the version checks) and `spec/detail_drawer_spec.rb` (its `mmdb.js` guards went with the file); all 73 browser tests pass.

## 6. Check and finish

- [x] 6.1 Break checks: in turn, bind the switch twice, drop the switch's footer line, drop the theme restore on close, append a link instead of swapping `href`, handle the button's click instead of `submit`, drop the registration timer's clear, and drop the autofocus. Confirm a browser or unit test fails each time.
- [x] 6.2 Run the full suite: `bundle exec rspec`, `npm test`, `npm run typecheck` and `npx playwright test`.
- [x] 6.3 In the README's list of browser-tested flows, add account (sign-in, Sign Out, Account Settings, the theme, registration's password check) and navigation (the menu, the Movies/TV Shows switch, the home poster preview). Confirm the list still matches the files in `e2e/`.
- [x] 6.4 Run `openspec validate vanilla-js-account --strict`.

## Workflow follow-up

- Work on the `vanilla-js-account` branch. Run `/ponytail:ponytail-review` on the diff before the first commit. Archive as the change PR's last commit, then open the PR with gh.
- After the merge, the user deploys with the next tag from `gh release list`. Then validate on mmdb.online without changing data: open and close the sign-in dialog, switch Movies and TV Shows from the menu and back, open Account Settings, flip the theme and close without Update, preview a home page poster.
- Update the jQuery rewrite memory: change 6 done; change 7 deletes `bootstrap.js`, its `legacy.d.ts` entries, jQuery and `bootstrap.min.js`.
