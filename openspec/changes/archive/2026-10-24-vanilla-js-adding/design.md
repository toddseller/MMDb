# Design

## Context

The adding flow is `public/js/mmdb.js` lines 226 to 553: a dozen handlers that show and hide `#preview`, `#dismiss`, `#scroll-left`, `#scroll-right`, `#search` and the add button. The markup is in `users/show.erb`, `movies/show.erb` and `shows/show.erb` (`.preview-wrapper`), `_add_movie.erb` and `_add_show.erb` (the search forms), and the result partials:
- `_preview.erb`: `#create-movie` forms
- `_shows_preview.erb`: `#create-show` forms
- `_episodes_preview.erb`: `#create-episode` forms, one per episode and one for Add All Episodes

Every route answers JSON. Searches return `{ query, page }`. Adding returns `{ status: "true", page, ... }` with the new grid and counts. The show season pick returns `{ status, page, count }` with the episode list.

Other jQuery code uses the panel:

| Caller | Owner | Use |
| --- | --- | --- |
| `updateDatabase` (edit form's Search) | change 4 | shows the searching message, then results in movie layout, or the placeholder on failure |
| `displayEditForm` | change 4 | closes the panel |
| `displayCreateShow` (Create New Show) | change 5 | closes the panel, then opens the create-show modal |
| `deleteMovie` | change 4 | redraws the grid and count with `listMovie` after a delete; it gets its own small success handler, since the panel isn't involved |

Module conventions from changes 1 and 2 apply: `// @ts-check` with JSDoc, `#mmdb/` imports, `on()` delegation bound on `document`, `request()`, and `init(document)` called from `main.js`.

## Goals / Non-Goals

**Goals:**
- The panel looks and moves as it does today. The exception is the fix the proposal names: titles shown as text.
- One module owns every show and hide of the panel, including for the jQuery callers.

**Non-Goals:**
- Making the panel responsive. Its fixed sizes stay until the responsive change.
- Changing the server's search or add routes, or what they return.
- Porting Create New Show or the edit form's search. Both stay jQuery and reach the panel through `window.preview`.
- Handling a failed add. Today the "Adding…" message stays up when the add request fails, and this change keeps that (see Risks).

## Decisions

**One table holds the movie and show differences.** `preview.js` has a `LAYOUT` object keyed by `movies`, `shows` and `episodes`, holding the inline values the jQuery code sets today:

| | Panel | Dismiss | Arrows | Arrow glyph line height |
| --- | --- | --- | --- | --- |
| movies | stylesheet height (350px) | `top: 0` | stylesheet (200px at 87px) | stylesheet (4em) |
| shows | `height: 300px` | stylesheet (87px) | stylesheet | stylesheet |
| episodes | `height: 300px` | stylesheet | `height: 169px; top: 84px` | `3.3em` |

The page picks movies or shows from whether `#movie-list` exists. A season pick switches to episodes. Leaving the CSS alone means the responsive change reworks these sizes once, in one place.

**Showing sets `style.display`; the `hidden` attribute can't do it.** The themes hide `#search`, `#preview`, `#dismiss` and the arrows with ID rules (`display: none`), which outrank the attribute's user-agent rule. Removing `hidden` would leave them hidden. `show(el, display)` sets the value jQuery's `.show()` would (`block`, or `flex` for the panel), and `hide(el)` sets `none`. `previewMovie` added `!important` to the panel's `flex`, but the only `!important` display rules are Bootstrap's utility classes, which the panel doesn't carry. The add button has no stylesheet rule, so showing it just clears `display`.

**`motion.js` gains `slideDown(el, display, ms)` and `slideUp(el, ms)`.**
- `slideDown` sets the display, measures the height, and animates height from 0 with `overflow: hidden` for the duration.
- `slideUp` animates to 0, then hides the element.
- Durations stay jQuery's: 300ms to open and dismiss, 500ms to close after an add.
- Both act at once under reduced motion or without `el.animate`, as the fades do.
- `fadeIn` gains a `display` argument, defaulting to `''`, for the arrows, which the stylesheet hides.

**The arrows follow the scroll position.** An `updateArrows()` runs after results render and on the panel's `scroll` event:
- the left arrow shows when `scrollLeft > 0`
- the right arrow shows when `scrollLeft + clientWidth < scrollWidth - 1`
- an arrow fades only when its state changes

A click calls `panel.scrollBy({ left: ±clientWidth, behavior })`, with `behavior: 'auto'` under reduced motion and `'smooth'` otherwise. That replaces jQuery's 1000ms animate. Whether results fit is measured, not counted, which keeps the "six or fewer are centred" rule (from `query.length`) separate from whether arrows show.

**A newer fade or slide cancels the one still running.** Each of `fadeIn`, `fadeOut`, `slideDown` and `slideUp` first cancels the element's running animations, so an earlier hide can't finish after a later show (a cancelled animation never runs its `onfinish`). This also fixes the drawer's footer, which could stay hidden after a poster was opened and closed within 400ms. The arrows track what they are meant to show in a `WeakMap`, since a fading-out arrow still reads as shown.

**Only the latest search fills the panel.** A counter goes up with every search and on close. A search whose number is no longer the latest drops its answer. So results arriving after a dismiss don't reopen the panel, and an earlier, slower search can't replace a later one.

**Messages are built as elements.** `loading(text)` replaces the panel's contents with a `div#loading` holding an `h3` whose `textContent` is the message, plus `div.loader`. That's the same markup as today, so the stylesheet still applies. The movie failure placeholder (`/imgs/loading_image.svg`) and Create New Show button are static markup with no data in them, so they're set from fixed strings.

**Forms post what jQuery's `serialize()` sent.**
- `new URLSearchParams(new FormData(form))` plus `filter`, the collection search box's value, as `movieToDB` and its siblings append it.
- A `URLSearchParams` body makes fetch send `application/x-www-form-urlencoded`, which Sinatra parses as before.
- `FormData` leaves out the submitter, as `serialize()` does. The show poster's `<input type="image">` therefore sends no `x`/`y`, as today.
- The episode title for the message comes from `episode[title]`, or "Season <button id>" for Add All Episodes, as `episodeToDB` does.

**Failure means any failed request, not just a 500.** `request()` throws for any non-2xx response, and the catch shows the placeholder or Create New Show. jQuery only reacted to a 500 and left the panel on "Searching…" for anything else, which this improves without a separate path.

**`window.preview = { search(url), close() }`.**
- `search` runs the movie-layout search flow against any URL: `updateDatabase` passes `/movies/update?title=…&route=…`.
- `close` is the dismiss path without the click.
- `updateDatabase`, `displayEditForm` and `displayCreateShow` lose their panel lines and call these instead.
- `legacy.d.ts` types it.

**Each jQuery binding goes when its module binding lands**, as in change 2: the search, add, dismiss and arrow bindings come out of `dynamicListener` in the task that binds them in `preview.js`.

## Risks / Trade-offs

- [A failed add leaves "Adding…" up, as today] → Unchanged on purpose. Showing an error is new behaviour and needs its own decision. Dismiss still closes the panel.
- [The `#create-show` button `_episodes_preview.erb` renders when a season has no episodes isn't in a form, so clicking it does nothing] → Existing behaviour that belongs to Create New Show (change 5). Recorded here, not fixed.
- [`createShow`'s `$('.index-preview') > 0` is always false, so the id always comes from the session] → Left for change 5 with the rest of Create New Show. The session id is set whenever a collection page loads, so it works today.
- [A slide measured with `offsetHeight` reads 0 if the panel's contents haven't laid out] → The panel's height is fixed by the stylesheet or the table, not by its contents, so measuring after setting the display is enough.
- [The browser tests answer searches from recordings] → The seed regenerates them from the real routes on every run, as for the existing add tests.

## Migration Plan

Front-end only, plus the two theme imports raised to `?v=4` so browsers fetch the edited `movies.css`. It ships with the next release tag. Rolling back means redeploying the previous tag.
