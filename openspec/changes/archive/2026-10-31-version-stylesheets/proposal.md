# Proposal

## Why

Scripts get a `?v=` from their file's modified time, but the stylesheets `app.css` pulls in with `@import` carry versions typed by hand. PR #491 edited `movies.css` without raising its version, so Cloudflare and browsers kept the old copy for hours and production showed the new season line unstyled, while every test passed. PR #492 fixed it by hand; nothing stops it happening again.

## What Changes

- The layout links each of the app's stylesheets directly, in the order `app.css` imports them today, each through `asset_path`, so every stylesheet's version follows its file the way the scripts' do.
- **BREAKING** (internal only): `public/css/app.css` is deleted. Pages have one `<link>` per stylesheet (11 today) in place of the single `app.css`. Every theme still uses the same set, and picking a theme still loads nothing new.
- Hand-set `?v=` numbers go away, and with them the rule that every stylesheet edit must raise one.
- Tests and e2e fixtures that read or intercept `app.css` move to the new links.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-assets`: every `/css/` stylesheet on a page is versioned from its file, replacing the hand-raised import versions; the no-snippets rule checks that every stylesheet is the app's own rather than that `app.css` is the only one.
- `user-account`: picking a theme keeps the same stylesheets on the page, rather than "exactly one stylesheet".

## Impact

- Views: `app/views/layout.erb` (the stylesheet links).
- Styles: `public/css/app.css` deleted; no other stylesheet changes. Bootstrap's relative `../fonts/` URLs resolve the same from `/css/`.
- Tests: `spec/page_assets_spec.rb`, `spec/themes_spec.rb`, `spec/detail_drawer_spec.rb`, `spec/account_spec.rb`, and the e2e `e2e/fixtures.js`, `e2e/scrollbar.spec.js` and `e2e/account.spec.js`.
- No server routes, data, API or deploy changes. The content security policy (`style-src 'self'`) already allows the links.
- The project memory note about raising `?v=` by hand becomes obsolete and should be removed once this ships.
