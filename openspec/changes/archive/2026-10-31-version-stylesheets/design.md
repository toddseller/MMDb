# Design

## Context

`app/views/layout.erb` links one stylesheet, `asset_path('/css/app.css')`. `app.css` holds only eleven `@import` lines, in cascade order: `normalize`, `bootstrap.min`, `palette`, `layout`, `typography`, `navigation`, `modals`, `movies`, `drawer`, `dialog`, `responsive`. A static CSS file can't call `asset_path`, so the imports' `?v=` numbers are typed by hand. `asset_path` already versions any file under `public/` from its modified time, and the import map uses it for every script module.

Two e2e helpers add rules to the page by intercepting `**/css/app.css*` and appending to its body (an inline `<style>` would break the content security policy): `useTheme` in `e2e/fixtures.js` and the scrollbar test in `e2e/scrollbar.spec.js`.

## Goals / Non-Goals

**Goals:**
- Every stylesheet's URL changes when, and only when, its file changes, with no step for the developer.
- The cascade order stays exactly as it is, so nothing on screen moves.

**Non-Goals:**
- Versioning the Bootstrap glyph fonts that `bootstrap.min.css` loads by relative URL. They have not changed since the file was added and are not edited by hand.
- Bundling, minifying or combining the stylesheets.

## Decisions

**Link each stylesheet from the layout, through `asset_path`.** The layout loops over the eleven names, in today's order, and writes one `<link rel='stylesheet'>` per name. This reuses `asset_path` unchanged and adds no route or helper. The list lives in the layout because it's used nowhere else; tests read the rendered links. Browsers fetch the links in parallel, where the `@import` chain made them wait for `app.css` first, so pages load no slower.

Alternative considered: keep `app.css` but generate it from a Sinatra route that writes each `@import` with its file's version, and version `app.css` by the newest stylesheet's time. It keeps one stylesheet on the page, but adds a route, a second versioning rule and the serial `@import` fetch. The user chose the links.

**Delete `public/css/app.css`.** Leaving it would invite someone to add an `@import` that ships unversioned. A test checks that no stylesheet under `public/css/` has an `@import`.

**e2e helpers append to `responsive.css`.** It is linked last, so rules appended to it still come last in the cascade, as they did when appended to `app.css`. Both helpers intercept `**/css/responsive.css*`.

**Tests pin behaviour, not the file.** The Ruby specs that read `app.css` (`page_assets_spec.rb`, `themes_spec.rb`, `detail_drawer_spec.rb`) change to check the rendered page: every `/css/` link has a `?v=`, touching one stylesheet changes only its version, and the theme stylesheets are linked. The "one stylesheet" checks (`account_spec.rb`, `e2e/account.spec.js`) become "the same stylesheets before and after a theme pick, all under `/css/`". The test that `modals.css?v=2` serves the same file as `modals.css` stays: a versioned URL must still resolve.

## Risks / Trade-offs

- [A new stylesheet added to `public/css/` but not to the layout list is never loaded] → The same was true of a file missing from `app.css`. It shows at once in development.
- [Eleven requests in place of one] → They were already eleven requests plus `app.css`. Cloudflare serves over HTTP/2, and the links fetch in parallel.
- [A browser holding the old `app.css` page] → None to manage: each deploy renders new HTML (`cf-cache-status: DYNAMIC`), and the new page never asks for `app.css`.

## Migration Plan

Ship as one PR and release with a `vYYYY.MM.DD.N` tag as usual. After the deploy, check that the live page links each stylesheet with a `?v=` and that `/css/movies.css?v=<n>` holds the season-row rules. To roll back, revert the PR and release again; `app.css` returns with its hand-set versions.
