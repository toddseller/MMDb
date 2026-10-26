# Design

## Context

Adding episodes posts the episodes form (`addEpisodes` in `public/js/mmdb/preview.js`). The server answers with the whole shows grid and the counts (`app/controllers/users_episodes.rb`), and `showCollection` replaces `#show-list`'s contents with it. The open drawer is an element inside `#show-list`, inserted after the last poster of its row, so the replacement removes it. `drawer.js` notices only lazily: `isOpen()` checks `drawer.isConnected`.

Related code that already exists:

- Movie save (`edit.js`) already redraws the grid, then reopens the saved movie's drawer instantly.
- `drawer.js` already moves the open drawer to a new row when a phone turns: it detaches the element and inserts it after `rowEnd(current)`.
- It eases the drawer between heights when switching posters in a row (`swap`).
- It keeps a poster still while the page above it changes height (`holdStill`).

The drawer's content for a show comes from `GET /users/:user_id/shows/:id`. That route renders the show's active season, and adding episodes never changes the active season.

The search panel (`#preview`) sits above the grid and closes over 500ms (`CLOSE_AFTER_ADD_MS`), animating its height. That moves everything below it, including the open poster.

## Goals / Non-Goals

**Goals:**

- The add flow in the spec delta: no gap, an eased height change, and the poster held still.

**Non-Goals:**

- Adding a movie, saving or deleting a show, and Create New Show keep their current behaviour.
- No change to which season a show's drawer shows.
- No server change: the episodes endpoint keeps returning the grid only.

## Decisions

### Fetch the drawer's details after the add, before touching the page

`addEpisodes` waits for the add's answer and then, if a drawer is open, requests the open show's details. Only when both have arrived does it change the page, in one synchronous step: replace the grid, put the drawer back, start the easing. The browser can't paint in the middle, so the drawer is never seen missing.

The details request has to follow the add, because it must see the new episodes.

- **Alternative: have the episodes endpoint also return the drawer's HTML.** It saves a round trip, but it adds a parameter and a template call to the server for something the existing details route already does.
- **Alternative: replace the grid first, then fetch and reopen.** This is the flicker the owner wants to avoid.

If the details request fails, the grid is still replaced and the drawer is left closed, as today. That is no worse than the current behaviour and keeps the add's result on screen.

### Move the existing drawer element instead of opening a new one

`drawer.js` gains an export that takes the open drawer out before the grid is replaced and puts it back after the open show's new poster:

1. Detach the drawer element.
2. The caller replaces the grid.
3. Find the poster by its link: `.show-modal[id="<show id>"]`, as `edit.js` finds a movie.
4. Insert the drawer after `rowEnd` of that poster's tile and mark the tile open.
5. Run the existing `swap` with the new details, which eases from the old height to the new one.

This is the same move the resize handler already makes. Moving the element keeps the old content in place until `swap` replaces it, so the easing starts from exactly the height on screen. `swap` already handles reduced motion and equal heights.

- **Alternative: reopen instantly with the old HTML, then swap.** Same look, but it rebuilds content that is already there.

If the poster isn't found, or is hidden (`offsetParent === null`), the drawer is not reinserted and the drawer state is cleared, as `close(true)` would. `rowEnd` can't place a drawer after a hidden tile.

### Hold the poster still across the swap and the panel's close

Before the swap, read the open poster's top on screen. After the drawer is reinserted, call `holdStill` with that top. It scrolls by however far the poster moves each frame, which covers:

- a new show above the open one, which moves the poster at once;
- the search panel closing above the grid, which moves it over 500ms.

`holdStill` today runs for `DRAWER_MS` (450ms), shorter than the panel's 500ms close, so it gains a duration argument. The add passes the panel's close time; existing callers keep `DRAWER_MS`. The poster is kept still only as far as the page can scroll, matching the existing row-switch requirement. At the top of the page, the panel's close still pulls it up.

### One rule for every show

No check compares the added show with the open one. The drawer was showing something the owner chose; keeping it is right whichever show changed. For another show, the refresh is just the same content.

## Risks / Trade-offs

- [The add takes one more request when a drawer is open] → It's the same small request a poster click makes, and it runs while the "Adding…" message still shows.
- [The owner closes the drawer or opens another poster while the add is running] → The show to refresh is read when the add's answer arrives. When the page is changed, whatever drawer is open then is the one moved, and it gets the fetched details only if it is still that show's; a drawer closed in the meantime stays closed.
- [The page's own scroll anchoring could also adjust when the grid is replaced] → `holdStill` measures the poster's actual position each frame, so it corrects whatever scrolling happened first.

## Migration Plan

Front-end only; it ships with a normal release after the producer repair now running in production has finished, since a deploy restarts the container it runs in. Rollback is the previous release.
