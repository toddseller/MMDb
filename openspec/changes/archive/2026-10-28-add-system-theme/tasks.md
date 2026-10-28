# Tasks

## 0. Branch

- [x] 0.1 After `merge-theme-stylesheets` is merged, create `add-system-theme` from a freshly fetched `origin/master` and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. The server

- [x] 1.1 In `spec/account_spec.rb`, write failing tests:
  - saving `theme=system` stores `system`;
  - saving `theme=bogus` answers `status: "false"` and leaves both the stored theme and the session's unchanged;
  - a save refused for another reason (a taken email) answers `"false"`.
- [x] 1.2 Add `User::THEMES` and the inclusion validation. Drop the `|| 'default'` in `PUT /users/:id`, and only update the session and answer `"true"` when `update` succeeds. Verify 1.1 passes.
- [x] 1.3 In `spec/account_spec.rb` and `spec/session_expiry_spec.rb`, write failing tests:
  - `<html>` carries `data-theme` with the user's saved theme;
  - a visitor with no session gets `system`;
  - signing out gives `system`;
  - an unknown session value renders `system`;
  - the page has one stylesheet, `/css/app.css?v=...`, and no `link#theme`.
- [x] 1.4 Add `page_theme` to `session_helper.rb`, make `sign_out!` store `system`, and render `data-theme` and the single stylesheet in `layout.erb`. Verify 1.3 passes.
- [x] 1.5 In `spec/account_spec.rb`, write a failing test that registering saves the new account with `system` and renders its first page with `data-theme="system"`. Then have `post '/users'` set `theme: 'system'`, and verify it passes.

## 2. The stylesheet

- [x] 2.1 In `spec/themes_spec.rb` and `spec/page_assets_spec.rb`, write failing checks:
  - `app.css` exists and imports the shared list, versioned;
  - `default.css` and `dark.css` are gone;
  - `palette.css` maps `[data-theme="default"|"dark"|"system"]` to `color-scheme: light | dark | light dark`.
- [x] 2.2 Create `app.css` from the shared import list, move the `color-scheme` rules into `palette.css` keyed on `data-theme`, and delete `default.css` and `dark.css`. Raise `palette.css`'s `?v=`. Verify 2.1 passes.

## 3. The choice in Account Settings

- [x] 3.1 In `spec/js/account.test.js`, replace the switch tests with failing ones:
  - the dialog shows three radios with the saved one checked;
  - picking one sets `<html data-theme>`;
  - closing unsaved puts the saved value back;
  - a successful save keeps the new one.
- [x] 3.2 Replace the switch in `_edit_user.erb` with the three radios and their button-group styling. Change `account.js`'s preview and restore to the attribute, and delete the now-dead `onoffswitch` rules. Verify 3.1 passes and `npm run typecheck` is clean.

## 4. In the browser

- [x] 4.1 Rewrite the theme tests in `e2e/account.spec.js` and write failing ones:
  - picking Dark makes the page dark with one stylesheet;
  - closing unsaved puts the theme back;
  - saving System with `emulateMedia({ colorScheme: 'dark' })` makes the reloaded page dark, and switching the emulated scheme to light turns it light without a reload;
  - a signed-out visitor follows the emulated scheme.
- [x] 4.2 Change `e2e/letter-rail.spec.js`'s `useTheme`, and any other e2e test that serves one theme's stylesheet for the other, to `emulateMedia`. Run the whole Playwright suite and verify all pass.
- [x] 4.3 Run the whole RSpec and JS suites and verify all pass.
- [x] 4.4 Screenshot Account Settings with the three choices in both themes, on desktop and at 390px, and a signed-out page with the device set to light and to dark. Get the owner's approval before committing.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `add-system-theme`, archive the change in the same PR and open it with `gh`; the owner merges.
