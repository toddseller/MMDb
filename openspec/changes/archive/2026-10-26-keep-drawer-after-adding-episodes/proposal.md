# Proposal

## Why

When a show's drawer is open and the owner sees missing episodes, they can search for the show, pick the season and add them, but the drawer closes as soon as the episodes are added. They then have to find the poster and open the drawer again to see the result. The drawer isn't closed on purpose: adding episodes redraws the whole shows grid, and the drawer, which sits inside the grid, goes with it.

## What Changes

- After episodes are added, a drawer that was open stays open under the same show's poster, whichever show the episodes went to.
- The drawer shows that show's details as they are after the add, so episodes added to the season it was showing appear in it.
- The drawer stays on the season it was showing. Adding episodes still never changes a show's active season or its poster.
- The swap shows no gap: the new grid and the drawer's new details are both fetched before either is shown.
- The drawer eases from its old height to its new one, as it does when switching posters in the same row, and changes at once under reduced motion.
- The open poster stays where it was on screen, even when the add puts a new show above it, as far as the page can scroll.
- When the open show is no longer in the grid (for example, a title filter now hides it), the drawer closes, as it does today.
- With no drawer open, adding episodes behaves exactly as today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-drawer`: adds a requirement that an open drawer stays open, refreshed in place, when episodes are added from the search panel.

## Impact

- `public/js/mmdb/preview.js` (adding episodes) and `public/js/mmdb/drawer.js` (moving an open drawer into a redrawn grid).
- One extra request after an add with a drawer open: the details request a poster click already makes (`GET /users/:user_id/shows/:id`). No server, route or view changes.
- Tests: `spec/js/preview.test.js`, `spec/js/drawer.test.js` and an end-to-end test in `e2e/adding.spec.js`.
- Deploying waits until the producer repair running in the production container has finished, since a deploy restarts that container.
