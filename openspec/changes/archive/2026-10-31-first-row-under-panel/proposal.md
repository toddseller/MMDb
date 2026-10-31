# Proposal

## Why

On desktop the search band is pinned to the top of the window, and the results panel opens inside it, covering about the top 350px. Nothing in the page makes room for it, so while the panel is open the collection's first row sits under it at every scroll position and can't be clicked. An owner who searches, then wants to open a first-row title, has to dismiss the panel first. Phones don't have this problem: their band scrolls with the page, so the panel pushes the posters down. This came to light fixing a flaky test (PR #494), which had been clicking a first-row poster before the panel finished opening.

## What Changes

- On desktop, while the panel is open, the page gains room above the collection equal to the panel's height, so scrolling to the top shows the first row whole, just below the panel, and clickable.
- At the top of the page, the posters slide down with the panel as it opens and back up as it closes.
- When the owner opens or closes the panel while scrolled down the collection, the page scrolls by the same amount at once, so the posters on screen don't move. The panel covers the top of the window then, as it does today.
- Opening a poster's details with the panel open removes the room at once, before the drawer opens, so the drawer never opens under a page that is still sliding.
- Phones and short windows are unchanged: their band already scrolls with the page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `adding-to-collection`: adds a requirement that the open panel never leaves the first row of the collection unreachable, and that opening or closing it doesn't move the posters on screen when the owner is scrolled down.

## Impact

- Views: `app/views/users/show.erb`, `app/views/movies/show.erb` and `app/views/shows/show.erb` gain an empty spacer right after the search band.
- Styles: `public/css/movies.css` (the spacer is hidden until the panel opens).
- Scripts: `public/js/mmdb/preview.js` (open and close the room with the panel, keep the scroll in step) and `public/js/mmdb/drawer.js` (close the room at once when a poster opens).
- Tests: `spec/js/preview.test.js`, `spec/js/drawer.test.js`, and new Playwright tests in `e2e/adding.spec.js`.
- No server, data or API changes.
