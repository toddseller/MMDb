# Proposal

## Why

This is the last of the seven changes that replace jQuery. Changes 1 to 6 moved every feature into typed ES modules. jQuery 1.9.1 (from Google's CDN) and Bootstrap 3.3.6's JavaScript are now loaded for just two Bootstrap plugins: the modal behind the three dialogs (`#logIn`, `#movie`, `#edit-show`), reached through `public/js/mmdb/bootstrap.js`, and the tab plugin that switches show edit's panels. The browser's own `<dialog>` does what the modal plugin does, so both libraries can go. The page then loads no third-party script for its own features.

Findings on the way:
- **Enter in a show-edit field leaves the page.** The dialog's forms have real `action`s and nothing handles their submit, so Enter in an input such as the episode number posts the form natively and the browser lands on an error page.
- **Clicking outside a dialog doesn't close it.** Bootstrap closes only on a click on the `.modal` element itself, and the theme shrinks `.modal` to the dialog box, so a click on the dimmed backdrop does nothing (checked on mmdb.online). That stays as it is: a stray click can't throw away unsaved edits.
- **The dialogs fade in and out.** Bootstrap fades the dialog and backdrop and slides `.modal-dialog` down. A native dialog disappears the moment it closes, so keeping the fade-out needs the close to wait for it.

## What Changes

- **The three dialogs become `<dialog>` elements**, opened modally. The browser now focuses the `autofocus` field, closes on Escape, keeps the page behind out of reach, and returns focus to whatever opened the dialog.
- **New module `public/js/mmdb/dialog.js`**, typed with JSDoc and unit-tested first, replaces `bootstrap.js`. It opens and closes dialogs. Every close (Escape, a close button, Cancel, a module closing after a save) goes through it, and it waits for the fade-out before the dialog actually closes.
- **The fade stays.** New stylesheet `public/css/dialog.css`, imported by both themes, fades the dialog and backdrop and slides `.modal-dialog` in on open and out on close. It does so only when the visitor hasn't asked for reduced motion; with reduced motion the dialogs open and close at once.
- **Close buttons and the Sign in button lose their Bootstrap attributes.** The × buttons get one attribute that `dialog.js` handles. `account.js` opens sign-in from its button.
- **Show edit's tabs switch their own panels.** The tab buttons drop `data-toggle="tab"`, and `show-edit.js`'s existing tab handler also shows the matching panel.
- **Enter in a show-edit field acts as OK**, in both the edit and Create New Show dialogs. Textareas still take Enter as a new line.
- **The sign-in dialog clears itself and Account Settings restores the saved theme** on the dialog's own `close` event, which also fires on Escape.
- **Removed:**
  - `public/js/mmdb/bootstrap.js`, `public/js/mmdb/legacy.d.ts`, `spec/js/bootstrap.test.js`
  - the jQuery and `bootstrap.min.js` script tags, and `public/js/bootstrap.min.js`, `public/js/bootstrap.js`, `public/js/npm.js`
  - `e2e/vendor/jquery.min.js` and the route in `e2e/fixtures.js` that serves it
  - `bootstrap.css` stays: the layout, grid and dialog styling still use it
- **Browser tests come first** for what changes: Escape closes a dialog after its fade-out, a click outside leaves it open, the page doesn't scroll behind an open dialog, closing sign-in by Escape clears it, Enter in show edit saves, and the page loads without jQuery.

## Capabilities

### New Capabilities

- `dialogs`: how the site's dialogs open and close: the focused field, the ways to close (close button and Escape, but not a click outside), the fade, and the page behind staying put.

### Modified Capabilities

- `show-edit`: Enter in a dialog field saves the way OK does, and the tabs switch panels without Bootstrap.

## Impact

- **New files:**
  - `public/js/mmdb/dialog.js`, with `spec/js/dialog.test.js`
  - `public/css/dialog.css`
  - `e2e/dialogs.spec.js`
- **Changed:**
  - `app/views/layout.erb`: the three dialogs, the Sign in button, the removed script tags
  - `app/views/partials/_modal.erb`, `_preview_modal.erb`, `_edit_user.erb`: the × buttons
  - `app/views/partials/_edit_show.erb`, `_create_show.erb`: the tab buttons
  - `public/js/mmdb/account.js`, `navigation.js`, `show-edit.js`, `public/js/main.js`
  - `public/css/default.css`, `public/css/dark.css`: import `dialog.css`
  - `spec/js/dom.js`, `account.test.js`, `navigation.test.js`, `show-edit.test.js`: dialog stubs in place of the `window.$` fake
  - `e2e/fixtures.js`, `e2e/smoke.spec.js`, `e2e/show_edit.spec.js`
  - `README.md`: the front-end notes and the browser-test notes that mention jQuery
- **Deleted:** `public/js/mmdb/bootstrap.js`, `public/js/mmdb/legacy.d.ts`, `spec/js/bootstrap.test.js`, `public/js/bootstrap.min.js`, `public/js/bootstrap.js`, `public/js/npm.js`, `e2e/vendor/jquery.min.js`
- No server, route or data changes. The page's only external scripts left are analytics (Google Tag Manager, Optimizely).
