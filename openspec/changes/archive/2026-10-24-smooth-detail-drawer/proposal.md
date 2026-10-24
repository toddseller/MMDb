# Proposal

## Why

Clicking a movie or show poster slides a details drawer open under its row, but the motion is jerky in both directions. The code behind it is hard to change safely.

The motion problems:
- The drawer animates `max-height` from 0 to 900px linearly, so it pops open and pauses before closing.
- It's often inserted and activated in the same tick, so it appears with no transition at all.
- Switching to another poster removes the open drawer instantly.
- The × button closes it instantly too, and then the same poster needs two clicks to reopen.

The code problems:
- Row ends are hard-coded to 7 movies or 6 shows, so the drawer lands in the wrong place at other window widths.
- Grid spacing is rewritten in JavaScript after every insert.
- The same open logic is copied in four places, and the CSS in both themes.

## What Changes

- The movie and show lists lay out as a CSS grid, and the drawer spans the full row under the clicked poster at any window width.
- The drawer eases open to its content's height and eases closed, the same way whether it's closed by its poster or by its × button.
- One drawer, kept in the page:
  - Clicking the open poster closes it.
  - Clicking another poster in the same row swaps the content in place.
  - Clicking a poster in another row closes the old drawer while the new one opens, and the page scrolls so the clicked poster stays where it was.
- The open poster still grows and the pointer still shows, without moving neighbouring posters.
- Motion is skipped for people who ask their system for reduced motion.
- No server, data or markup changes for the details themselves. The edit, rating and season forms inside the drawer keep working.

## Capabilities

### New Capabilities

- `detail-drawer`: how a movie's or show's details open, switch and close under its poster in the collection grid.

### Modified Capabilities

None.

## Impact

- `public/js/mmdb.js`: `getMovieModal`, `closeInfo`, `switchInfoDiv`, `displayUpdatedMovie`, `filtered` and `filteredWithInfo`, plus the `.info` clean-up in `clearFilter` and `deleteMovie`.
- `public/css/themes/default/movies.css` and `public/css/themes/dark/movies.css`, plus a new shared `public/css/drawer.css`. Under `page-assets`, `default.css` and `dark.css` raise the `?v=` on the imports they change.
- New specs that check the stylesheets and script. The motion itself is checked in a real browser.
