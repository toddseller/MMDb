# Design

## Context

Movie posters are rendered by four partials:

| Partial | Used by | Poster loading today |
|---|---|---|
| `_my_movies` | The user's movies page (`users/show.erb`) | `class="lazy" data-original=…`, loaded by the jQuery lazyload plugin |
| `_movie_list` | Unwatched and 4K lists (`users_movies_controller.rb:22`, `movies/show.erb`) | `src=…`: every poster at once |
| `_filtered_list` | Search and the update responses | `src=…`: every poster at once |
| `_top_movies` | Home page top and recent movies | `data-original=…`, plugin |

Shows:
- `_my_shows` already uses `src` and `loading="lazy"`.
- `_show_list` (re-rendered after adding episodes) is plugin-only.
- `_updated_show_list` has both.

The plugin is loaded in `layout.erb`. `.lazyload()` runs in `application.js` on ready and three times in `mmdb.js` after the list is re-rendered.

`Show#thumbnail` rewrites `600x600.jpg` to `400x400.jpg`. Movie poster URLs on Apple (`is1-ssl.mzstatic.com`) end in `/<W>x<H><suffix>.<ext>`: 2000x3000 (1,948 of user 1's movies), 800x1200, 1400x2100, 600x600, 1200x630 and others. Apple serves any size in that slot: `…/348x522bb.jpg` returned 348×522 at 73KB, against 1,941KB for `2000x3000.jpg`.

Both theme `movies.css` files start with `img { -webkit-transform: translate3d(0, 0, 0); }`.

## Goals / Non-Goals

**Goals:**
- Implement the three spec deltas. Measure load and drawer frames before and after, in the same browser.

**Non-Goals:**
- Server time and query count (the page arrives in 0.4s).
- Paginating the 2.3MB of HTML.
- Resizing `cdn.myflix.stream` or other non-Apple posters.
- Changing show poster sizes.

## Decisions

**`Movie#thumbnail` mirrors `Show#thumbnail`.** It replaces a trailing `/<W>x<H><letters>.<jpg|png|webp>` on `mzstatic.com` URLs with `/348x522bb.<ext>`, and returns any other value unchanged, with nil as `''`. 348×522 is twice the 174×261 tile, so it's sharp on Retina screens. `bb` asks Apple to fit within that box, so landscape and square artwork keep their shape, just as they're scaled into the tile today.

**One `<img>` form across all grid partials:** `src="<%= movie.thumbnail %>" loading="lazy"`, with the existing `alt`, width, height and inline style. `class="lazy"` and `data-original` are dropped. The two show partials get the same treatment with `show.thumbnail`. The `onError` fallback to `/imgs/animated.svg` stays where it already is, because it covers broken URLs, not lazy loading.

**The plugin is removed outright:** the script tag, the four `.lazyload()` calls and `public/js/jquery-lazyload.js`. With native loading there's nothing left for it to do, and its scroll handler is what made `content-visibility` freeze.

**Drop the `img` layer rule from both themes.** Nothing needs it, since the drawer only transforms the one open poster. `movies.css` goes to `?v=3`.

**`content-visibility: auto` on movie tiles only, in `drawer.css` (`?v=3`):**

```css
#movie-list > .index-preview { content-visibility: auto; contain-intrinsic-size: 174px 303px; }
#movie-list > .index-preview.open { content-visibility: visible; }
```

- `303px` is the tile's fixed height, so skipped tiles reserve their real size and the scroll height doesn't change.
- `content-visibility` also clips a tile's contents to its box. The open tile draws outside it (the scaled poster and shadow, the pointer at `bottom: -28px` and the larger "New" ribbon), so it's exempt while open.
- Shows already run at 17ms per frame, so their tiles are left alone.
- `drawer.rowEnd` reads `offsetTop` and `:visible`, which still work on skipped tiles because each keeps its intrinsic size.

## Risks / Trade-offs

- [A stored Apple URL doesn't end in a size slot] → It's requested unchanged, as today.
- [Posters load slightly later while scrolling fast] → Chrome starts native lazy loads well before the viewport (about 1,250px or more), which is earlier than the plugin's `threshold: 0`.
- [A tile clipped by `content-visibility` loses part of its look] → Only the open tile draws outside its box, and it's exempt. Covered in the browser check, including hover states.
- [Browser numbers vary between runs] → Measure several opens before and after in the same session, and compare medians.

## Measured before and after

Measured on the local app against the production database, signed out, in one Chrome session at a 3360×1745 window, for user 1 (4,526 movies). Drawer frames come from three opens (tiles 700, 714 and 728) and a row switch to tile 756.

| | Before | After |
|---|---|---|
| HTML done | 367ms | 383ms |
| `load` (tab spinner stops) | 2,847ms | 788ms |
| Poster data on load | 39.7MB in 44 requests | 4.1MB in 87 requests (native loading also fetches some just below the screen) |
| Drawer opens | 6 to 8 frames, median 170 to 183ms, worst 226 to 270ms | 44 to 45 frames, median 17ms, worst 18 to 25ms |
| Row switch | median 83ms, worst 240ms | median 17ms, worst 35ms |
| Jump from the top to tile 2500 | froze for 30s when `content-visibility` was tried with the plugin | 29ms, all 42 posters around it loaded |

Also checked:
- The open poster, its shadow, the pointer and the "New" ribbon aren't clipped.
- The poster holds still during a row switch.
- Scroll height is unchanged (196,878px).
- The unwatched list (2,582 posters), the home page and the shows grid all load lazily.
- Both themes.

## Migration Plan

Front-end and view only. Deploy as usual. Roll back by reverting the commit. Browsers pick up the new files through the raised `?v=` versions.
