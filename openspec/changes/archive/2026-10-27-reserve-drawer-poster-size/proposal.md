# Proposal

## Why

The drawer's poster has a width but no height until its image arrives, so it starts 0px tall. Below 1200px, where the poster sits above the details, the title and everything under it jump down by the poster's height once it loads; on desktop the drawer opens to the text's height and then grows a second time. The full poster is also the slowest image on the page (Apple originals can be 2000x3000), so the jump is easy to see.

## What Changes

- The movie drawer's poster always takes a 2:3 box: 340x510 on desktop, the full width on a phone.
- The show drawer's poster always takes a square box: 447x447 on desktop, the full width on a phone. A portrait poster, such as one from TMDB, sits centred in the square with empty bands at its sides rather than being stretched or cropped.
- While the full poster loads, the drawer shows the image of that title already on screen:
  - on opening, the grid tile's poster that was just clicked, which the browser already holds;
  - on switching seasons, the previous season's poster that was just in the drawer.
  The placeholder is cleared once the full poster has loaded, so it never shows in a portrait poster's side bands.
- Behind both, each theme's poster colour fills the box when no image is there yet.
- The dark theme's `height: 447px` on the show poster, which `responsive.css` always overrides, is removed.

Out of scope: episode thumbnails in the edit form, how the show grid shapes TMDB portraits on a phone, and loading a smaller full poster for the drawer.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-drawer`: adds a requirement that the drawer's poster holds its size and shows the image already on screen while it loads. The glide-into-view requirement no longer glides when the poster loads, since the poster can no longer change the drawer's height.

## Impact

- `public/css/drawer.css`: the poster boxes for both drawers, at every width.
- `public/css/themes/{default,dark}/movies.css`: the show poster's colour replaces `background: none`; the dark theme's fixed height goes.
- `public/css/themes/dark/modals.css`: the movie poster gets the dark theme's colour.
- `public/css/default.css`, `public/css/dark.css`: import versions bumped so browsers fetch the new CSS.
- `public/js/mmdb/drawer.js`: sets the placeholder when the drawer opens or swaps, and clears it on load.
- `public/js/mmdb/show-edit.js`: `showSaved` keeps the previous poster as the placeholder.
- Tests: `spec/detail_drawer_spec.rb`, `spec/js/drawer.test.js`, `spec/js/show-edit.test.js`, `e2e/drawer.spec.js`, `e2e/responsive.spec.js`.
- No server, API, data or dependency changes.
