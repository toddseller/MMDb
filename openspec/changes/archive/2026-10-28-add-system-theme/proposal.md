# Proposal

## Why

A user can choose Light or Dark, but not "match my device", so a phone set to switch to dark at night still shows the theme picked once in Account Settings. Signed-out visitors get a theme nobody chose:
- a first visit is dark, because `layout.erb` treats anything but `'default'` as dark;
- after signing out it is light, because sign-out stores `'default'`.

This builds on `merge-theme-stylesheets`, which makes every colour a `light-dark()` value. With that in place, following the device is just a matter of which `color-scheme` the page asks for.

## What Changes

- Account Settings offers three theme choices: **Light**, **Dark** and **System**. They replace the on/off switch, and picking one still previews it at once.
- **System** follows the device's light or dark setting and changes with it while the page is open.
- Signed-out visitors, on a first visit and after signing out, get **System**, and so do new accounts.
- The theme is set by an attribute on the page's root element, rendered by the server. Only one stylesheet remains, so changing the theme no longer swaps stylesheets.
- The server stores only `default`, `dark` or `system`. Any other value is refused, so it never reaches the page. Stored values keep their meaning (`default` is light), so there's no migration.

Out of scope: more themes, per-device theme memory, and themes for the API clients.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `themes`: adds the System theme and the signed-out visitor's theme.
- `user-account`: the theme switch becomes a three-way choice, and a saved choice is checked against the three allowed values.
- `page-assets`: one stylesheet in place of the two theme entry stylesheets.

## Impact

- **Views:** `app/views/layout.erb` drops the swappable `<link id="theme">` and renders `data-theme` on `<html>`. `app/views/partials/_edit_user.erb` replaces the switch with three radio buttons.
- **Server:**
  - `app/helpers/session_helper.rb`: sign-out leaves `system`, and a small helper picks the page's theme;
  - `app/models/user.rb`: the allowed theme values;
  - `app/controllers/users_controller.rb`: saves the chosen value.
- **CSS:** `public/css/default.css` and `public/css/dark.css` become one `public/css/app.css`. The `color-scheme` rules move to `palette.css`.
- **JS:** `public/js/mmdb/account.js` previews and restores the theme by setting the attribute.
- **Tests:**
  - RSpec: `spec/account_spec.rb`, `spec/page_assets_spec.rb`, `spec/session_expiry_spec.rb`, `spec/themes_spec.rb`;
  - JS: `spec/js/account.test.js`;
  - e2e: `e2e/account.spec.js`, `e2e/letter-rail.spec.js`, and any other e2e test that serves one theme's stylesheet.
- No database migration. Existing `default` and `dark` users see no change.
