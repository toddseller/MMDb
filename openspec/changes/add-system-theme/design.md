# Design

## Context

This assumes `merge-theme-stylesheets` has shipped: colours are `light-dark()` values in `palette.css`, and `default.css` and `dark.css` differ only in `:root { color-scheme: ... }`.

Today:
- `layout.erb` renders `<link id="theme">` with `href` set to light only when `session[:theme] == 'default'`, and dark otherwise, so a visitor with no session gets dark.
- `sign_out!` sets `session[:theme] = 'default'`, so a signed-out visitor gets light.
- `account.js` previews by swapping that link's `href`. It remembers the saved `href` and puts it back when the dialog closes unsaved.
- `PUT /users/:id` saves `params[:theme] || 'default'`, with no check on the value. It answers `status: "true"` and copies `@user.theme` into the session whether or not `update` succeeded.
- The `users.theme` column defaults to `'default'`.

## Goals / Non-Goals

**Goals:**
- Light, Dark and System, chosen in Account Settings and previewed live.
- System for every signed-out visitor.
- Only the three known values can reach the session or the page.

**Non-Goals:**
- Renaming the stored `default` value to `light`. It would need a data migration and gains nothing a user can see.
- Remembering a theme per device, or for signed-out visitors.

## Decisions

### The theme is an attribute on `<html>`, and `color-scheme` follows it

`layout.erb` renders `<html lang="en" data-theme="<%= page_theme %>">`. `palette.css` maps it:

```css
[data-theme="default"] { color-scheme: light; }
[data-theme="dark"]    { color-scheme: dark; }
[data-theme="system"]  { color-scheme: light dark; }
```

With `light dark`, the browser picks the side from the device setting, and switches live when it changes. No media query or script is needed, because every `light-dark()` already reacts to it.

- *Alternative:* keep two entry stylesheets and add a third for System. That's three files differing by one line, and the link swap would stay.
- With one stylesheet, `default.css` and `dark.css` are replaced by `app.css`. A file named "default" holding every theme would mislead.

### One helper decides the page's theme

`page_theme` in `session_helper.rb` returns `session[:theme]` when it is in `User::THEMES` (`%w[default dark system]`), and `'system'` otherwise. That covers no session, an old session, or anything unexpected. `sign_out!` stores `'system'`.

- Checking on the way out, not only on save, means a stale or tampered session can't put an unknown value into the page.

### The server only stores a known theme, and says so when it refuses

- `User` gets `validates :theme, inclusion: { in: THEMES }`. Existing rows hold `default` or `dark`.
- Registration sets `theme: 'system'` in `post '/users'`, so a visitor keeps their theme when they sign up. The column default stays `'default'`, which avoids a migration for the one place that creates accounts.
- The update action drops the `|| 'default'`, since the radios always send a value.
- It now checks `update`'s result. On failure it answers the existing `status: "false"` shape and leaves the session alone. Today a failed `update` still answers `"true"` and copies the unsaved value into the session.
- *Alternative:* quietly map an unknown value to `default`. That hides a bad request as a successful save.

### Three radio buttons styled as a button group

`_edit_user.erb` replaces the checkbox switch with three real radio inputs named `theme`, values `default`, `dark` and `system`, labelled Light, Dark and System. They're laid out like the Bootstrap `btn-group` the show edit dialog's tabs already use. The selected look comes from `:has(:checked)`, so no script is needed for it.

- Real radios give keyboard arrows, a screen-reader group and form reset for free.
- *Alternative:* a `<select>`. It works, but hides a three-item choice behind a click.
- The `onoffswitch` rules the old switch used become dead and are deleted. The HD/Standard `showonoffswitch` in the show edit dialog is separate and stays.

### Preview and restore set the attribute

- On `change` of `#logIn input[name="theme"]`, `account.js` sets `document.documentElement.dataset.theme` to the picked value.
- The saved-theme memory holds that value in place of a stylesheet URL. Closing unsaved puts it back, and a successful save updates it from the response's `theme`.

### Tests choose the theme through the device setting

Tests of the theme itself (a visitor's page, a saved System theme) use `page.emulateMedia({ colorScheme })`. Tests that only need to run under both themes (`letter-rail.spec.js` and the phone checks in `responsive.spec.js`) visit signed-in pages too, where the seeded user's saved Light ignores the device. They use one `useTheme` helper in `e2e/fixtures.js`, which serves `app.css` with one more rule forcing that theme's `color-scheme`. It replaces the two copies of the old trick that served one theme's stylesheet in place of the other.

## Risks / Trade-offs

- [A cached page from before the deploy still has `<link id="theme">` and the old script] → Both URLs change with the deploy (`app.css?v=`, the module import map), so a reload gets the new pair together.
- [Checking `update`'s result also surfaces other validation failures that used to answer "true" (a taken email or user name)] → That's the correct behaviour. The dialog already shows the `"false"` case, so the user sees the save didn't happen instead of being told it did.
- [API clients that read `theme`] → They still receive one of the three strings. `system` is new, and a client that only knows two values treats it like any unknown value. The JSON API and the myflix client are out of scope.

## Migration Plan

No data migration. Deploy as usual. Rollback is reverting the PR. A user who saved `system` meanwhile would then render dark under the old layout, which is acceptable for a rollback.
