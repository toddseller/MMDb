# Proposal

## Why

Change 6 of the seven that replace jQuery. Changes 1 to 5 moved the filters, the details drawer, adding, movie edit and show edit into typed ES modules. What is left in `public/js/mmdb.js` is the account and navigation code: sign-in, the menu, Sign Out, Account Settings with its theme switch and password fields, the registration page's password check, the Movies/TV Shows switch and the home page's poster preview. Moving it empties `mmdb.js` and `application.js`, so both go, and jQuery is left only for Bootstrap's own plugins until change 7.

Findings on the way:
- **The Movies/TV Shows switch sends two requests per click.** `#user-movies` and `#user-shows` are bound twice, directly and through `document`, so each click fetches the page twice and swaps it in twice.
- **The registration page's password check doesn't wait for a pause.** Its timer is a fresh local each keystroke, so nothing is ever cleared and every keystroke runs its own check 1.5 seconds later.
- **The theme switch adds a stylesheet each time it's flipped.** Each flip appends another `<link>`, unversioned. Closing Account Settings without Update leaves the page in the unsaved theme.
- **Account Settings saves on the Update button's click.** Enter in a field only works because browsers click the default button; the form's own submit is never handled.
- **Closing the menu leaves Profile's triangle turned.** It clears a `triangle-bottom` class that nothing has.
- **Saving Account Settings with the theme switch off turns the dark theme on.** The unchecked box sends no `theme`, the user's theme is stored as empty, and the layout loads `dark.css` for anything other than `default`.

## What Changes

- **New module `public/js/mmdb/account.js`**, typed with JSDoc and unit-tested first. It owns:
  - sign-in: an empty form shows the error line without a request; a refused sign-in shows it and clears the form; closing the dialog clears it; a successful one goes to the user's collection
  - Sign Out
  - Account Settings: opening it from the menu, the current-password and confirm fields enabling Update, saving on the form's submit, a refused password showing the error and resetting the password fields, and a successful save closing the dialog and updating "Signed in as"
  - the theme switch: one stylesheet link whose versioned URL swaps between the two themes; closing without a successful Update puts back the saved theme
  - the registration page's password check, run once the typing pauses for 1.5 seconds
  - focusing a dialog's `autofocus` field when Bootstrap has shown it
- **New module `public/js/mmdb/navigation.js`**, also unit-tested first. It owns:
  - the menu and its Profile submenu
  - the Movies/TV Shows switch, from the menu and from the button on another user's collection: one request per click, the page and footer count swapped in, the menu closed
  - the home page's poster preview, opening the movie's details dialog
- **`PUT /users/:id` stores `default`** when the theme switch is off.
- **The layout's theme `<link>` carries both themes' versioned URLs**, so the switch never loads an unversioned stylesheet.
- **New module `public/js/mmdb/bootstrap.js`** holds every call into Bootstrap's jQuery plugin: `modal`, now shared with `show-edit.js`, and the `shown.bs.modal` and `hidden.bs.modal` events, declared in `legacy.d.ts`. Change 7 deletes both.
- **Removed:** `public/js/mmdb.js` and `public/js/application.js`, with their two `<script>` tags; the never-bound `openMenu`, `closeMenu` and `goToProfile` go with them.
- **Browser tests come first** for what isn't covered: the Movies/TV Shows switch both ways from the menu and from the in-page button (one request, the footer's count), Sign Out, a failed sign-in, Account Settings with a wrong and a right password and a name change, the theme reverting on close and staying after Update and a reload, the registration password check, and the home page poster preview.

## Capabilities

### New Capabilities

- `user-account`: signing in and out, Account Settings (name, email, password and theme), and the registration page's password check.
- `site-navigation`: the signed-in menu, switching between a user's movies and TV shows, and the home page's poster preview.

### Modified Capabilities

None.

## Impact

- **New files:**
  - `public/js/mmdb/bootstrap.js`, with `spec/js/bootstrap.test.js`
  - `public/js/mmdb/account.js` and `navigation.js`, with `spec/js/account.test.js` and `navigation.test.js`
  - `e2e/account.spec.js` and `e2e/navigation.spec.js`
- **Changed:**
  - `public/js/main.js`, `public/js/mmdb/legacy.d.ts`, `public/js/mmdb/show-edit.js`
  - `app/views/layout.erb`: the theme link and the two script tags
  - `app/controllers/users_controller.rb`: the saved theme
  - `e2e/seed.rb`: a second user with a movie and a show, for the in-page switch
  - `e2e/modals_tabs.spec.js`, where its account tests move to `account.spec.js`
  - `README.md`'s list of browser-tested flows
- **Deleted:** `public/js/mmdb.js`, `public/js/application.js`
- No data migrations or CSS changes.
