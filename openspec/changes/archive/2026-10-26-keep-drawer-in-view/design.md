# Design

## Context

All drawer movement lives in `public/js/mmdb/drawer.js`:

- `open` inserts the drawer after its row and lets CSS grow it. The `.info` row eases from `0fr` to `1fr` over .35s, and its `margin-top` from 0 to 20px.
- `swap` replaces the content of an open drawer and eases `.info-wrapper` between the old height and the new one.
- `show` picks between those two, and for a poster in another row also calls `holdStill`, which keeps the clicked poster in place on screen for 450ms while the old drawer closes.
- `keepOpen` (PR #452) moves the drawer into a redrawn list after episodes are added, swaps in the new details and holds the poster for the search panel's 500ms close.

Content also changes outside `drawer.js`:

- `showSaved` in `show-edit.js` replaces the drawer's content after a season switch, a show save or an episode added in the edit dialog.
- A movie save reopens the drawer instantly through `open` (`edit.js`).
- The edit form (`edit.js` `showForm`) and the "more" toggle (`credits.js`) change the height too, but they stay out of this change.

What can be seen on screen:

- **Top:** the pinned navbar and search band take 160px on desktop and 50px on phones and short screens. Tiles already carry that height plus 10px as `scroll-margin-top` (170px and 60px, in `responsive.css`), for the letter rail's jumps.
- **Bottom:** a fixed `<footer>` 25px tall.

The drawer's own poster `<img>` has no width or height, so the drawer grows again when it loads.

## Goals / Non-Goals

**Goals:**

- One reveal step that every place the drawer opens or reloads calls, giving the behaviour in the spec delta.

**Non-Goals:**

- No glide for "more" or the edit form.
- No change to where the drawer opens, how it eases, or `holdStill` itself.
- No glide when the owner closes a drawer.
- No glide on pages without a drawer.

## Decisions

### One `reveal` in drawer.js, given where the drawer will end

`reveal(bottom, { up })` works out how far to scroll:

- `bottom` is where the drawer's bottom edge will be on screen once it has finished easing.
- **Down by:** the smaller of how far `bottom` is below the footer's top, and how far the open tile's top is below the top limit. If that's more than zero, it scrolls by it.
- **Up:** with `up`, a tile above the top limit scrolls the page up to it. Only opening a drawer passes `up`; reloaded content never scrolls up.

The scroll is `window.scrollBy` with `behavior: 'smooth'`, or `'auto'` under `prefers-reduced-motion: reduce`, the same choice `letter-rail.js` makes.

- **Alternative: `scrollIntoView({ block: 'nearest' })` on the drawer.** It can't keep the poster's row in view: for a drawer taller than the screen it lines up the drawer's top, which hides the poster.

### Limits come from the page, not from constants

- **The top limit** is the open tile's own `scroll-margin-top`. It already holds the pinned header plus 10px at each breakpoint, and it stays right if the header changes.
- **The bottom limit** is the top of the fixed `<footer>`, measured on screen, or the window's bottom if there is none.

### The glide starts with the drawer's easing, aimed at the eased end

Waiting for the transition to end and then measuring would make the glide trail the drawer by .35s. So the end position is predicted when the drawer starts easing:

- **`open`:** the drawer's current top, plus the open margin (20px), its borders and `.info-wrapper`'s `scrollHeight`. `scrollHeight` is the content's full height even while the row is still `0fr`.
- **`swap`:** the wrapper's top plus the target height `to` that `swap` already computes.
- **`showSaved`:** the content is replaced at once with no easing, so the real bottom is measured right away.

The open margin is a constant beside `DRAWER_MS`, naming the `drawer.css` rule it mirrors. While the drawer eases open, the margin it still has to gain is the constant minus its current computed `margin-top`, so the prediction holds at any point during the easing. (The plan was to read it from the stylesheet, but an open drawer's computed margin is mid-transition when it is read.)

### Where each case calls it

| Case | When it reveals | Up? |
|---|---|---|
| Open with no drawer open (`show` to `open`, or a movie save's instant reopen) | right away | yes |
| Same row (`swap`) | right away | no |
| Another row (`show`) | when `holdStill` ends (450ms), measuring the real layout, since the new drawer has finished opening by then | yes |
| Adding episodes (`keepOpen`) | when its hold ends (the panel's 500ms) | no |
| `showSaved` (season switch, show save, dialog episode add) | right away, through an exported `reveal` that measures the open drawer | no |
| Poster image loads | a `load` listener on the drawer, caught on the way down since `load` doesn't bubble, measuring the real layout | no |

The image case ignores images inside the movie edit form (`.edit-form`), which shows the movie's poster: its load would otherwise glide the page when the form opens. It uses the same downward-only rule. An image that loads after the owner has scrolled into a tall drawer finds the poster's row already above the top limit, so nothing moves.

### Glides started by the owner stay the owner's

Browsers end a smooth scroll as soon as the user scrolls, so nothing extra is needed. `holdStill`'s per-frame correction runs only during its hold, before any reveal, so the two never overlap.

## Risks / Trade-offs

- [The predicted end can be off by a few pixels, for example when the details wrap differently once fully open] → The drawer's image `load` recheck and the downward-only reveal correct a short glide, and an overshoot of a few pixels is invisible.
- [Existing Playwright tests measure positions after clicks, at 1500x900] → They are rerun, and any that now see a glide are updated to wait for the scroll to settle. The behaviour they check (row, swap, hold still) is unchanged.
- [On phones the letter rail shows on any scroll, so a glide brings it up for 2.5s] → Accepted; it fades as after any scroll.
- [The smooth scroll's length is the browser's, about 300 to 500ms, not exactly .35s] → Close enough to read as one motion. The letter rail already relies on it.

## Migration Plan

Front-end only. It ships with the next release, which waits until the producer repair's second pass has finished and been applied on the server. Rollback is the previous release.
