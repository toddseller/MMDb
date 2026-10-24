# Design

## Context

`#movie-list` and `#show-list` are `display: flex; flex-wrap: wrap`. Tiles are 174px movies and 213px shows, with `margin-right` zeroed by `nth-child(7n)` or `(6n)`. Inserting the `.info` drawer into the list shifts `nth-child`, so `filtered()` and `filteredWithInfo()` rewrite every tile's margin in JS.

`getMovieModal` works out the row end as `index % 7` (or `% 6`), fetches the details, inserts `<div class="info">` after the row end, and adds `.active` in the same tick. The drawer CSS is `max-height: 0 -> 900px`, `transition: all .3s linear`. The open tile is marked by toggling `.active` on its `img`, `.pointer`/`.show-pointer`, `.new-label` and `.new-text`, with `.notransition` added to stop some of those from animating.

Content inside the drawer lives in `.info-wrapper`. The edit, update and season forms replace `.info-wrapper`'s contents (`mmdb.js:449, 855, 892, 907`), and `modals.css` styles `.info-wrapper .modal-*`.

The theme `movies.css` files duplicate all of this and differ only in colours. Under `page-assets`, changed theme imports need a raised `?v=`.

There's no JavaScript test runner in the project, only RSpec.

## Goals / Non-Goals

**Goals:**
- Implement `specs/detail-drawer/spec.md` with one set of drawer code and one drawer stylesheet.

**Non-Goals:**
- Changing the drawer's content, the details partials or the routes.
- The search-preview panel (`#preview`), which has its own `slideDown` code.
- Adding a JavaScript test framework.
- Making the site responsive. `body` stays `width: 1386px` (7 movie posters and their gaps, sized for a MacBook Air), so rows stay at 7 movies and 6 shows. The `auto-fill` grid and the `offsetTop` row end already adapt to any width, so a later change that frees the body width gets correct drawer placement for free. That change also has to rework the navigation, drawer contents, modals and the search preview, and can drop the drawer's `100vw` full-bleed margins.

## Decisions

**The list becomes a CSS grid.**
- `#movie-list` uses `display: grid; grid-template-columns: repeat(auto-fill, 174px); gap: 2em; justify-content: space-between`, and `#show-list` the same with 213px.
- The drawer is a grid item with `grid-column: 1 / -1`.
- `gap` replaces the margins, so the `nth-child` rules, `filtered()` and `filteredWithInfo()` are deleted.
- At today's container width this gives the same 7 and 6 columns.

**The row end comes from layout.** Starting at the clicked tile, take visible following tiles while their `offsetTop` equals the clicked tile's, then insert the drawer after the last one. This handles filtered lists (hidden tiles have no layout box) and the last, partly filled row without counting.

**The drawer animates `grid-template-rows` from `0fr` to `1fr`.** `.info` is `display: grid; grid-template-rows: 0fr`, and `.info.open` is `1fr`. Its only child, `.info-wrapper`, gets `min-height: 0; overflow: hidden`. The transition is on `grid-template-rows` only:
- opening: `.35s cubic-bezier(.2, .8, .2, 1)`
- closing: `.25s ease-in`

This animates to the real content height with no measuring. Content that grows later just grows the track. The `margin-top` and border changes that `transition: all` animated now apply instantly with `.open`. We considered measuring `scrollHeight` and animating `height` in JS (more code, and it breaks when images load late) and `interpolate-size` (Chrome-only today).

**One drawer module in `mmdb.js`.** One `drawer` object holds the open tile and its element, with these operations:
- `open(tile, html)`: insert after the row end, force a style read (`el.offsetHeight`) so the closed state is committed, then add `.open` on the next animation frame.
- `close()`: remove `.open`, then remove the element after its transition ends.
- `swap(tile, html)`: same row. Fix `.info-wrapper`'s current height in px, replace the content, transition that height to the new `scrollHeight`, then clear the inline height.

`getMovieModal` chooses between toggle, swap, and close-plus-open. `closeInfo` (the × button), `displayUpdatedMovie`, `clearFilter` and `deleteMovie` call the same module instead of their own `.info` code. `activeItem` is cleared on every close, which fixes the second click currently needed after ×.

**Removal waits for `transitionend`, with a fallback.** An `afterTransition(el, fn)` helper runs `fn` once, on `transitionend` for `grid-template-rows` or after the duration plus 50ms, whichever comes first. With reduced motion there's no transition, so the fallback handles that case.

**The clicked poster stays still while a drawer above it closes.** Record the tile's `getBoundingClientRect().top` before the switch. Then, on every animation frame until both drawers finish, scroll the window by however far the tile has moved. A closing drawer below the clicked row doesn't move it, so nothing scrolls. This keeps the poster fixed during the motion, not just at the end.

**The open tile is marked with one `.open` class on the tile.** CSS hangs everything off it:
- the poster grows with `transform: scale(1.115)` from the top centre, plus the shadow
- the pointer shows with an opacity and transform transition
- the "new" label grows
- the movie title hides

`transform` doesn't affect layout, so neighbours stay put and `.notransition` is no longer needed.

The pointer is `z-index: 1`, which puts it above the drawer but below the poster (`z-index: 2`). The poster's shadow then darkens the pointer along with the drawer edge around it. Above the poster, it showed as a lighter diamond on movies.

**One stylesheet for structure and motion.**
- `public/css/drawer.css` holds the grid, drawer, tile-state and motion rules.
- Theme `movies.css` files keep only colours: drawer background, borders and pointer colour.
- `default.css` and `dark.css` import `drawer.css?v=2`, and raise the `?v=` on `themes/*/movies.css`. It's `v=2` because the pointer fix changed `drawer.css` after `v=1` was already cached in a browser.
- `@media (prefers-reduced-motion: reduce)` sets the drawer and tile transitions to `none`, and the scroll uses `behavior: 'auto'`.

## Risks / Trade-offs

- [`grid-template-rows` transitions need Safari 16+, Chrome 107+ or Firefox 66+] → Older browsers open and close without animating, which still works.
- [Swapping content in the same row uses a short JS height transition] → It's limited to `.info-wrapper` and clears its inline height afterwards, so later content growth still works.
- [`justify-content: space-between` spreads a partly filled last row differently from today's left-aligned flex row] → Use `start` if that looks wrong in the browser check.
- [No JS tests] → RSpec checks the stylesheet and script text for the agreed structure. The motion and placement are checked in a real browser at a wide and a narrow width, for movies and shows, in both themes.
- [At the top of the page, the poster can't be held still: the window can't scroll above 0] → It moves up with its row as the drawer above closes, which is what happened before this change. Anywhere else it stays put.
- [Browsers keep `mmdb.js` cached] → It's already versioned by `page-assets`, so no hard reload is needed.

## Migration Plan

Front-end only. Deploy as usual. Roll back by reverting the commit.
