# Design

## Context

The season buttons are `input.season-submit` elements inside `form#season-default` (`_show_info.erb`), styled `inline-block`, so a long list wraps. A show's details reach the drawer by `innerHTML` in three places:

- `insert` in `drawer.js`, when a drawer opens (also the instant reopen after a save);
- `swap` in `drawer.js`, when an open drawer moves to another poster in the same row (`show`), or is redrawn with new details after episodes are added (`keepOpen`);
- `showSaved` in `show-edit.js`, after a season switch or a show edit is saved.

The search panel already has scroll arrows (`preview.js`): it keeps what each arrow is meant to show in a `WeakMap`, since a fading-out arrow still reads as shown; fades them with `fadeIn`/`fadeOut` from `motion.js`; and scrolls with `scrollBy({ left: direction * clientWidth })`, smooth unless reduced motion. The drawer's background is `var(--surface)`.

## Goals / Non-Goals

**Goals:**
- One scrolling season line with arrows that behave like the search panel's.
- No scrolling the user can see except after an arrow click, a swipe or a trackpad scroll.

**Non-Goals:**
- Keyboard shortcuts for the arrows beyond their being focusable buttons. Tabbing through the season buttons already scrolls the line to each one.
- Changing the search panel's arrows' look or behavior.

## Decisions

- **The form becomes the scroll container.** `#season-default` gets `display: flex; flex-wrap: nowrap; overflow-x: auto` with its scrollbar hidden, and its buttons `flex: none`. A wrapper around it (`.season-row`, `position: relative; min-width: 0`) holds the two arrow buttons positioned over the line's ends, each with a fade from `var(--surface)` to transparent so a half-covered season reads as continuing. `min-width: 0` matters: a flex or grid parent would otherwise grow to fit all 48 seasons and the line would never scroll, which is what happened in the mockup. Alternative: a separate scrolling `div` inside the form. The form already wraps exactly the buttons, so it adds nothing.
- **Share the arrow logic with the search panel instead of copying it.** Move `preview.js`'s arrow toggle (the `WeakMap`, the "scrolled past start" and "more past end" tests, and the fade) and its page scroll into one small module, `scroll-arrows.js`, exporting `updateArrows(panel, left, right, { instant })` and `scrollPage(panel, direction)`. `preview.js` and the new `season-row.js` both call it. Alternative: a second copy in `season-row.js`. The rules are the same requirement in two places and should change together, which the existing preview tests then guard.
- **One function places the line: `placeSeasons(content, keep)`** in `season-row.js`. With `keep` (a number), it restores that scroll position; without it, it scrolls the line just far enough that the active season's right edge clears the right arrow, leaving it at 0 when the season already fits. It then sets the arrows with no fade, as they belong to the content that just appeared. It does nothing when the content has no season line (movies).
  - `insert` calls it with no `keep`, right after setting `innerHTML` and before the drawer opens, so it runs while the drawer is still closed and nothing can be seen moving.
  - `swap` takes the old line's `scrollLeft` before replacing `innerHTML`. `show` (another poster) places without `keep`; `keepOpen` (same show, new episodes) passes the old position.
  - `showSaved` reads the old position before `innerHTML` and passes it, since a season switch or save keeps the same show.
- **Arrows follow scrolling through one capture listener.** Scroll events don't bubble, so `season-row.js`'s `init` adds a capture-phase `scroll` listener on the document that updates the arrows when the target is a season line, plus a click listener (through `on`) for `.season-arrow`. A window resize updates the open drawer's arrows. Swipes, trackpads and tabbing all scroll the line, so the arrows track them without extra code.

## Risks / Trade-offs

- [jsdom has no layout, so unit tests can't prove the line doesn't wrap] → Unit tests fake `scrollWidth`, `clientWidth`, `offsetLeft` and `offsetWidth`, as `preview.test.js` does; a Playwright test with a 48-season show in the e2e seed checks the real layout, the arrows and the landing.
- [A new seeded show changes counts in other e2e tests] → The seed adds one show; the tasks include running the whole Playwright suite and adjusting any count it changes.
- [Hidden scrollbar hides the cue that the line scrolls] → The right arrow and the faded edge are the cue; the line still scrolls by swipe and trackpad.
- [Refactoring `preview.js`'s arrows could change the search panel] → Its existing tests run unchanged against the shared module before anything else is built on it.

## Migration Plan

A normal tag deploy; no data or settings change. Rolling back is the previous tag.
