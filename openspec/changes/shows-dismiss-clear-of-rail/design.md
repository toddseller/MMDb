## Context

`#dismiss` is placed by the stylesheet at `top: 87px; right: -50px`, out in the right gutter. `applyLayout` in `preview.js` then overrides it per layout: only `movies` sets `top: 0`; `shows` and `episodes` keep 87px. The letter rail (`#letter-rail`, fixed, `top: 160px`, same z-index as the fixed search band but later in the page) occupies that gutter, so at 87px inside the band (which starts at 50px) the X lands at about 158px and the rail takes its clicks. Opening a drawer closes the panel by calling `close` directly, which is why that works.

## Goals / Non-Goals

**Goals:** the X is clickable on the shows page in both the shows and episodes layouts, and sits in the same place on the movies and shows pages: level with the search box, where the shows page's X lands at `top: 0`.

**Non-Goals:** reworking the band's or the rail's stacking; moving the rail.

## Decisions

- **Move the X, not the rail.** Raising the band above the rail (`z-index: 5`) also frees the X, but the open band then hides the rail's top letters. With the X at `top: 0` the rail stays whole, and the shows page matches the movies page.
- **Set `top: 0` in the stylesheet and delete the per-layout dismiss style.** Every layout now wants the same position, so `LAYOUT.movies.dismiss`, the `dismiss` key in its typedef and the `dismiss.style.cssText` line in `applyLayout` go; `#dismiss` in `movies.css` gets `top: 0`. Its display is still set by `showPanel` and `close`, which never relied on `applyLayout`.

- **Anchor the X to the band, not the panel.** With `top: 0` inside `.preview-wrapper` the movies X still sits 34px lower than the shows one, because the movies page has its Library / Unwatched / 4K row above the panel. The owner asked for both in the shows position. The X moves out of `.preview-wrapper` to be a direct child of `#search-wrapper`, which gets `position: relative`, so `top: 0` is the search row's top on every page. A negative offset for the movies page was rejected: it would hard-code the row's height.

## Risks / Trade-offs

- The X sits at `top: 0` on phones too. The movies page already does this at every width, so nothing new is exposed, but only desktop (1500px) was checked in the browser.
