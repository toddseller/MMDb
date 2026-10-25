# Design

## Context

- Collection pages render every title at once, ordered by `sort_name`, in `#movie-list` or `#show-list`. Six partials draw tiles: `_my_movies`, `_movie_list`, `_filtered_list` for movies and `_my_shows`, `_show_list`, `_updated_show_list` for shows. Tiles show the title only; `sort_name` never reaches the page.
- `sort_name` is the title downcased with a leading The, A or An dropped, but a show's sort name can be edited freely in its edit dialog and is saved as typed, so it may not be lowercase.
- Filters replace grid contents through `filters.js`: a search, Unwatched and 4K replace `#movie-list`'s contents, and Clear replaces all of `#user-page`, grid element included.
- The details drawer opens inline between rows and, while closing, scrolls the page to keep the clicked row still (`drawer.js`). `close(true)` closes it at once.
- Side margins are at least 40px from the phone breakpoint up and 16px below it (`--gutter` in `responsive.css`). Phones and screens 500px tall or less pin a 50px bar at the top.
- Every poster has `loading="lazy"`.
- The e2e seed collection holds about eight movies, too short for the rail to appear.

## Goals / Non-Goals

**Goals:**
- One rail that serves movies and shows, desktop and phone, from the same markup and script.
- No extra requests: the letters come with the tiles the server already renders.

**Non-Goals:**
- Showing the current letter while scrolling (a scroll-spy highlight).
- Letters on the home page or in the episode lists.
- Fixing a show whose edited sort name is out of order with its neighbours; the rail follows the grid's order as it is.

## Decisions

### Every tile carries its letter; the first match in the page is the target
Each tile partial adds `data-letter` from a helper that maps a sort name to `a` to `z` or `#` (blank or missing sort names give `#`). The helper drops accents with `ActiveSupport::Inflector.transliterate` before taking the letter, because the database's `en_US.UTF-8` collation sorts É among the Es (`eagle < éclair < edge`); filing it under `#` would make E skip an É title at the start of its run. The script finds a letter's target with `querySelector('[data-letter="m"]')`, which returns the first in page order, so the grid's order decides the target.

Alternatives: tagging only the first tile of each letter needs state carried across partials that render one tile at a time, and must be repeated in all six. Working the letter out from the title in JavaScript gets edited show sort names wrong.

### The rail is server-rendered markup in the collection pages
A `_letter_rail` partial renders `<nav aria-label="Jump to letter">` with 27 links, included by the three collection page views. Letters with no titles get `aria-disabled="true"`, `tabindex="-1"` and a "no titles" label, set by the script; they look the same as the rest, and the click and drag handlers ignore them. The owner preferred this to dimming them, after trying dimmed letters on the prototype. Keeping it in the view keeps the markup reviewable with the page and testable in view specs.

### Desktop always shows the rail; phones check the threshold in the fade's scroll listener
On desktop the rail is always visible from CSS, as in Plex's web app, which the owner compared it with; a full-height rail in the margin is quiet enough to leave on. On phones it covers posters, so it appears only while useful: the stylesheet hides it unless the script marks it `shown`. A phone's rail shows only when `scrollY` is past one window height and the page is at least three window heights tall. The length check reads `scrollHeight`, which costs a layout, so it runs only on resize and after the grid changes; the scroll listener compares two numbers.

The first plan was a sentinel element watched by an `IntersectionObserver`, to keep work off scroll events. It was dropped during implementation: the phone fade already needs a scroll listener to restart its timer, so the threshold rides on that listener at no extra cost, without an added element.

### Grid changes are caught with a MutationObserver
A `MutationObserver` on the page body (child list, subtree), batched to one refresh per animation frame, recomputes which letters have titles and the length check. This follows Clear replacing `#user-page`, which would detach an observer placed on the grid itself, and needs no hook in `filters.js`. A refresh is 27 `querySelector` calls. Drawer opens trigger it too, which is harmless.

### Desktop or phone is decided by the existing breakpoint
`matchMedia('(max-width: 767px)')` selects the phone behaviour, the same breakpoint the stylesheet uses. On phones a passive scroll listener restarts a timer that removes the rail's visible state after 2.5 seconds; the owner chose that time on the prototype over 1 and 1.5 seconds. A pointer held on the rail, or focus within it, pauses the timer. The fade is a 150ms CSS opacity transition, removed under `prefers-reduced-motion`. A hidden rail uses `visibility: hidden` so its links leave the tab order.

### Jump, then glide
To jump, the script:

1. Closes an open drawer with `close(true)`.
2. Finds the target tile and works out its row's top, less the tile's `scroll-margin-top`.
3. If the target is more than two window heights away, calls `scrollTo` instantly to two window heights short of it, on the side the page is coming from.
4. Calls `scrollTo({ behavior: 'smooth' })` for the rest. Under reduced motion, step 4 is instant and step 3 is skipped.

Tiles in a row share a top, so the first tile's top is the row's top. `scroll-margin-top` on tiles is set in CSS to clear the pinned bar where it exists, so the stylesheet owns that number.

Two screens was chosen on the prototype (task 1), with a collection of about 4,600 movies, the size of the owner's library, comparing glides of 0.75, 1, 2 and 3 screens against a full smooth scroll. The full smooth scroll had the look the owner wanted, but across about 200 screens it blanked out in the middle, because posters were loaded and drawn more slowly than they passed. The owner chose the two-screen glide as the one that felt right.

Alternatives: a single `scrollIntoView({ behavior: 'smooth' })` passes every row, takes longer the further it goes, makes lazy posters along the way load, and blanks out on a large collection. A custom requestAnimationFrame tween gives an exact duration but is code the browser already provides.

### Dragging maps the finger's position to a letter
On touch, `pointerdown` and `pointermove` on the rail (with `touch-action: none`) turn the finger's height within the rail into one of 27 letters by proportion, and jump instantly to it when it has titles. A tap without a drag glides to its letter on `pointerup`. The proportion ignores which letters are drawn, so the every-other-letter rail on short screens still reaches every letter. A touch tap is handled by the pointer events, and the click that follows is ignored. Mouse clicks and Enter use the link's own letter.

### Placement
The rail is `position: fixed` in the space below the top bar. Every letter uses the theme's muted text colour, and letters with titles turn the accent colour on hover.

- **Desktop:** the rail runs the full height below the bar, less 16px at each end, and the 27 letters share that height equally (`flex: 1`), each clickable over its whole share. Letters are 13px and the rail is 30px wide, centred in the right margin, so it never covers a poster even where the margin is its minimum 40px. The owner chose this on the prototype over fixed-spacing rails of 11, 13 and 15px, after comparing it with Plex's web app.
- **Phones:** the rail is also full height, below the pinned bar less 8px at each end, with 12px letters sharing the height so each tap target is as tall as its share. It is 22px wide, 2px from the right edge over the last column, with a background of the theme's bar colour at 50% opacity and a 6px blur. The owner chose full height after finding a centred column of 11px letters too tight, and asked for the background lighter than the prototype's first 88%.
- **Short screens:** on screens 500px tall or less, every second letter is hidden with CSS, and the 15 left share the full height; all 27 would get about 13px each on a phone held sideways.

## Risks / Trade-offs

- [Smooth-scroll duration is chosen by the browser, and Safari and Chrome differ] → The glide is capped at two screens; check it in Safari during the hand check (task 6.2), and only add a custom tween if Safari's glide feels noticeably slower or blanks.
- [Off-screen tiles are skipped with `content-visibility` and counted at an estimated height, so a jump into undrawn rows can land short of or past its letter if the estimate is wrong] → The jump checks in task 5.3 run on the long seeded collection at desktop and phone sizes.
- [A body-wide MutationObserver fires on unrelated DOM changes] → Batched to one refresh a frame, and the refresh is cheap.
- [Edited show sort names can be out of order with the grid] → The rail goes to the first tile in page order with that letter, so it still lands on a real title. Fixing sort order is out of scope.
- [Translucent rail over posters on phones] → It fades after scrolling stops, so it covers the last column only while the user is moving.
- [The e2e seed grows] → The large collection goes to a new seeded user, so existing tests that count USER's or OTHER's titles are unchanged.

## Migration Plan

Nothing to migrate: no schema or API change. Ship with a normal tagged deploy. Rolling back is reverting the change.
