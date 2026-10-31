# Proposal

## Why

A show's drawer lists every season as a button under "SEASON:", and for long-running shows the buttons wrap onto several lines. This Old House's 48 seasons take two full rows, pushing the episodes down and making the active season hard to spot. One scrolling line with arrows keeps the drawer the same height for every show, as the old iTunes season bar did.

## What Changes

- The season buttons stay on one line. When they don't fit, the line scrolls sideways, and shows whose seasons fit look exactly as they do today.
- Arrows at the ends of the line glide it by its visible width, as the search panel's arrows do, and jump instead when the system asks for reduced motion. The left arrow shows only once the line is scrolled past its start, and the right arrow only while later seasons are hidden. A finger swipe or trackpad scrolls the line too.
- When a drawer opens or moves to another show, the line is already placed so the active season is in view, with no visible scrolling.
- Switching seasons inside the drawer, or adding episodes while it is open, keeps the line exactly where it was.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `detail-drawer`: adds requirements for the one-line season row, its arrows, where it lands when a drawer opens, and that it stays put when the drawer's content reloads.

## Impact

- Views: `app/views/partials/_show_info.erb` (the season row and its two arrow buttons).
- Styles: `public/css/movies.css` (the season row and arrows; the dark theme's look is the reference).
- Scripts: a new `public/js/mmdb/season-row.js`, and the places that put a show's details into the drawer: `insert` and `swap` in `public/js/mmdb/drawer.js`, and `showSaved` in `public/js/mmdb/show-edit.js`.
- Tests: new `spec/js/season-row.test.js`, additions to the drawer and show-edit JS tests, and a Playwright test with a long-running show added to the e2e seed.
- No server, data or API changes; movie drawers have no season row and are unaffected.
