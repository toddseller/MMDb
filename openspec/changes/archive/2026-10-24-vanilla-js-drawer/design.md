# Design

## Context

The drawer lives in `public/js/mmdb.js` as a jQuery object literal (`drawer`) with helpers `afterTransition` and `holdStill`. `getMovieModal` opens it from a poster click, and `searchByName` and `expandPlot` handle links inside it. Change 1 left `filters.js` calling `window.drawer.close(true)`, typed by `legacy.d.ts`. Three jQuery functions that later changes replace also use the drawer:

| Caller | Use |
| --- | --- |
| `seasonDefault` (show edit, change 5) | `drawer.tile.find('img')` to swap the poster |
| `displayUpdatedMovie` (movie edit, change 4) | `drawer.close(true)`, then `drawer.open(tile, html, true)` |
| `deleteMovie` (movie edit, change 4) | `drawer.close()` |

Module conventions from change 1 apply: `// @ts-check` with JSDoc, `#mmdb/` imports, delegated listeners through `on()` from `events.js`, requests through `request()`, and an `init(document)` per module called from `main.js`.

## Goals / Non-Goals

**Goals:**
- The drawer's behaviour stays as the `detail-drawer` spec and its browser tests describe it, at every width.
- One drawer module that every caller imports, or reaches through `window.drawer` until its caller is ported.

**Non-Goals:**
- Changing the drawer's CSS, timings or markup.
- Porting the drawer's content controls (edit, rating, HD toggle, season pick); changes 4 and 5 own those.
- Moving the credit search to a URL or history entry.

## Decisions

**Drawer state is module state.** There is one drawer per page, so `drawer.js` keeps `tile` and `el` in module variables and exports `show`, `open`, `close` and `isOpen`, plus `init(document)` for the poster clicks. A class or a factory would only add a constructor call nobody needs. The tests reset the state with `close(true)` in `beforeEach`.

**Rows come from `offsetTop`, as now.** `rowEnd(tile)` walks the tile's following siblings that match `.index-preview, .index-preview-show`, skips those with no layout (`offsetParent === null`, what jQuery's `:visible` checks), and stops at the first whose `offsetTop` differs. jsdom has no layout, so the unit tests define `offsetTop` and `offsetParent` on the tiles with `Object.defineProperty`. The browser tests already cover real layout.

**`afterTransition` keeps its timeout fallback.** It uses `addEventListener('transitionend')` filtered on target and `propertyName`, plus the same 450ms `setTimeout`, so reduced motion and browsers with no transition still remove the drawer. The unit tests drive it with `mock.timers`.

**`motion.js` replaces jQuery's footer fade.** `fadeIn(el)` and `fadeOut(el)` run `el.animate` on opacity over 400ms, jQuery's default. `fadeOut` sets `display: none` when it finishes, and `fadeIn` clears it first. Both act at once when `prefers-reduced-motion: reduce` matches, or when `el.animate` doesn't exist (jsdom). The alternative, CSS classes with transitions, would need a stylesheet change and a second `afterTransition`. `filters.js` calls `fadeIn` where change 1 set `display` directly.

**`window.drawer` passes elements, not jQuery.** `drawer.js` sets `window.drawer = { open, close, get tile() }`. The two jQuery lines that pass or read a tile change to `$(...)[0]` and `$(drawer.tile)`. We considered an adapter that takes either type and returns a jQuery tile. It would mean typing jQuery in `legacy.d.ts` and testing both input types, and changes 4 and 5 delete these callers anyway. `legacy.d.ts` types `window.drawer` with `HTMLElement`; `filterValue` stays, since `deleteMovie` still reads it.

**`credits.js` does what `searchByName` and `expandPlot` do now.**
- A credit click calls `preventDefault`, resets `#filter-input`, sets `window.filterValue`, and requests `/movies/search?filter=<name>&id=<user>`. The id comes from the first `.index-preview`, or `sessionStorage.id`. The query string is built with `URLSearchParams`, so names with spaces or `&` are encoded.
- The response fills the profile header (`no-image` hides the picture and centres the name, as the inline styles do now) and replaces `#movie-list`.
- One delegated binding on `.description-details a` covers the studio too, which removes the duplicate request.
- The plot toggle flips `active` on the previous `<p>` and sets its own text to `less` or `more`.

**jQuery bindings go when their module binds.** Each moved function's `dynamicListener` line is removed in the same task that adds the module binding. That way no click is ever handled twice, and the browser tests run green after every task.

## Risks / Trade-offs

- [`offsetParent` is null for `position: fixed` elements, not just hidden ones] → Tiles are never fixed. A unit test pins the hidden-tile case, and the browser tests pin the layout.
- [The credit search's browser test uses a recorded response, so it can't catch a server change to `/movies/search`] → `spec/` covers the route. The recording is regenerated from the real route on every seed, so markup drift shows up.
- [Module scripts run deferred, after `mmdb.js`'s `$(document).ready`] → The bindings are delegated from `#user-page`, which exists when either runs. The drawer only opens from a click, after both have run.

## Migration Plan

Front-end only. It ships with the next release tag. Rolling back means redeploying the previous tag; no data is involved.
