# Proposal

## Why

A drawer opens downward from its poster's row, and nothing scrolls the page to follow it. A poster near the bottom of the screen opens a drawer that is partly, or entirely, below the visible part of the page, and the owner has to scroll to find it. The same happens when a drawer grows: another poster's longer details, a season with more episodes, or newly added episodes.

## What Changes

- Whenever the drawer opens or its content is replaced, the page glides just far enough to bring the drawer's bottom above the count footer:
  - opening a drawer;
  - switching posters in the same row or another row;
  - switching seasons;
  - adding episodes;
  - saving a movie or show;
  - the drawer's poster image finishing loading.
- The glide never pushes the clicked poster's row under the bar pinned at the top of the page. A drawer too tall for the screen, as on most phones, ends with the poster's row at the top and the start of the drawer below it.
- Opening a drawer for a poster that sits partly under the top bar glides the page the other way, so the poster can be seen.
- A drawer already in view doesn't move the page. A height change from reloaded content only ever glides down to reveal more of the drawer, never back up, so a reader partway down a tall drawer keeps their place.
- Tapping "more" on a long plot and opening a movie's edit form don't glide: they change the drawer's height while the owner reads inside it, and the text they tapped would move under them.
- When switching rows, the glide waits until the poster has finished being held in place while the old drawer closes.
- The glide is the browser's smooth scroll, starting with the drawer's own easing. Under reduced motion the page moves to the same place at once, as the existing reduced-motion requirement asks.
- Scrolling by the owner during a glide stops the glide.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-drawer`: adds a requirement that the drawer glides into view when it opens or its content changes.

## Impact

- `public/js/mmdb/drawer.js` (opening, switching, `keepOpen` and a new step that brings the drawer into view) and `public/js/mmdb/show-edit.js` (season switches and show saves replace the drawer's content). Movie saves reopen the drawer through `drawer.js`, so `edit.js` needs no change.
- Possibly `public/css/drawer.css` or `responsive.css` for the space kept clear at the bottom of the screen.
- Tests: `spec/js/drawer.test.js`, `spec/js/show-edit.test.js`, and end-to-end tests in `e2e/drawer.spec.js`.
- No server changes. Deploying still waits for the producer repair to finish on the server.
