# Design

## Context

See proposal.md for why. The current state that shapes the approach:

- `body` is `width: 1386px` in both `themes/dark/layout.css` and `themes/default/layout.css`. `#search-wrapper` and `.preview-wrapper` repeat the 1386px, and `#search-boxes` and `#profile-wrapper` stretch to the window with `100vw` and `calc()` margins worked out from it.
- The grids are already CSS grids (`public/css/drawer.css`): `repeat(auto-fill, 174px)` for movies and `213px` for shows, with `justify-content: space-between` and gaps chosen so 7 movies or 6 shows fill 1386px exactly at Bootstrap's 14px font size. Only the page width stops them adding columns.
- The drawer finds its row from where tiles sit (`rowEnd` in `public/js/mmdb/drawer.js`), so it needs no script change for a different column count. Its content, `#meta-data` from `_info.erb`, is `width: 1170px`, and it is laid out with Bootstrap's `col-lg-4` and `col-lg-8`, which already stack below 1200px.
- The movie details dialog is `.modal-lg` at 1100px, holding the same `#meta-data`. `.modal` is fixed, centered by `translate(-50%, -50%)`, with `overflow: hidden`, so a dialog taller than the screen is cut off.
- The home page already uses Bootstrap columns (`col-sm-9`/`col-sm-3`, posters `col-xs-6`), which stack and go two across below 768px once the body stops forcing 1386px.
- The navbar's right side (`.navbar-right`) only floats right at 768px and up in Bootstrap 3, so on a phone it would drop below the logo.
- The two theme folders duplicate every layout rule and have drifted apart in places, so any layout rule written into them has to be written twice.
- Theme stylesheets are pulled in by `@import` from `dark.css` and `default.css`, and the `page-assets` spec requires a raised `?v=` on an import whenever that file changes.
- Playwright has one project, Desktop Chrome at 1500x900. `e2e/drawer.spec.js` depends on the seeded titles falling into rows of 7 there.

## Goals / Non-Goals

**Goals:**
- Mostly CSS. Hands-on testing on a phone added small script and markup changes (see "Decisions from hands-on testing"); there are no server, API or data changes.
- New width-dependent rules live in one place, shared by both themes.
- The 1500px desktop window looks and behaves as it does today: 7 movies or 6 shows per row, same header, same drawer.

**Non-Goals:**
- Moving every layout rule out of the theme folders. Only the widths this change touches move.
- Replacing Bootstrap 3's CSS or its grid classes.
- Any phone layout for the owner tools (see proposal.md, Out of scope). They only lose their fixed widths, so they no longer force sideways scrolling.

## Decisions

### A shared `public/css/responsive.css`, imported last by both themes

The fixed widths are deleted where they are declared in the theme files, and their fluid replacements and every phone rule go into one new stylesheet that `dark.css` and `default.css` both import after their theme files. This follows `drawer.css` and `dialog.css`, which already hold layout shared by both themes while colors stay in `themes/<theme>/`.

- *Alternative: edit both theme copies in place.* Rejected: every media query would be written twice in files that have already drifted.
- *Alternative: move all layout out of the themes now.* Rejected for this change: most of that layout doesn't change here, and the diff would bury the responsive work.

### The phone breakpoint, at `max-width: 767px`, and two narrower rules

The phone layout switches at Bootstrap 3's `xs` boundary, which the home page columns and `.navbar-right` already follow, so the hand-written rules switch at the same width as the framework's. There's no tablet layout: at 768px and up, the fluid desktop layout fits, with fewer columns. Two rules use other queries, each where the layout itself changes: the compact pinned bar also applies at `max-height: 500px` (a phone held sideways), and the show drawer's episode rules change below 1200px, where its `col-lg-*` columns stack.

### Gutters: 16px on a phone, 40px on desktop, ramping to two posters on wide screens

The page gets `padding-inline: var(--gutter)` instead of a width. Below 768px, `--gutter` is 16px, the usual phone gutter. From 768px up it is:

```css
--gutter: clamp(40px, (100vw - 1640px) * 0.22, 376px);
```

- **Up to about 1820px it is 40px.** That matches the logo's and menu button's existing 40px insets, so the grid lines up with the navbar. It also keeps the 1500px test window at 7 movies per row: 1500 - 80 = 1420px holds 7 tiles (1386px) but not 8 (1588px), so `e2e/drawer.spec.js` keeps working unchanged.
- **From there it widens smoothly.** At 2560px, a 27" 4K monitor at 150% scaling, it is about 202px, one movie tile and a gap. That screen then shows 10 movies or 9 shows per row with clear margins, instead of 7 movies and 6 shows today.
- **From about 3350px up it stays at 376px,** two movie tiles and the 28px gap between them, so a 3840px window shows 15 movies or 13 shows per row.

Posters per row with this ramp, movies / shows, worked out from tile and gap sizes: 7 / 6 at 1500px, 9 / 7 at 2000px, 10 / 9 at 2560px, 15 / 13 at 3840px.

The slope was chosen at 2560px. Show artwork is wider than movie posters (213px against 174px), so the show count changes at different margins than the movie count. About 200px is the widest margin that still gives 9 shows. It also leaves about 15px of slack in both grids, so a classic scrollbar, which `scrollbar-gutter: stable` reserves on every page, doesn't drop a column.

- *Alternative: a fixed 40px at every desktop width.* Rejected: on large monitors the posters run nearly to the screen edges.
- *Alternative: a steeper ramp, reaching 376px by 2560px (slope 0.4).* Rejected after comparing mocks: at 2560px it shows only 9 movies and 7 shows.
- *Alternative: a shallower ramp giving 11 movies at 2560px.* Rejected: it needs about 30px less margin a side and still shows 9 shows.
- *Alternative: a flat percentage, such as 7.5vw.* Rejected: at 1500px it leaves 1275px, so the laptop window drops to 6 movies per row and the drawer specs' rows of 7 break.
- *Alternative: two posters' width at every desktop width.* Rejected: at 1500px it leaves room for only 3 movies per row.

### Full-bleed bands use the gutter, not `100vw`

`#search-boxes`, `#profile-wrapper` and the drawer's `.info` reach the window edges today with `100vw` and `calc(-50vw + 50%)` margins. Where a scrollbar takes up space, `100vw` includes the scrollbar, which makes the page wider than the window: exactly the sideways scroll this change removes. Inside a page that now spans the window less its gutters, full bleed is just a negative margin of one gutter on each side. A custom property, `--gutter`, holds the width, so both breakpoints change it in one place.

### Grids: fixed tiles on desktop, fixed column counts on a phone

At 768px and up, the existing `repeat(auto-fill, 174px)` and `213px` rules stay as they are, so wide windows gain columns and tiles keep the size the `movie-collection` spec's 348x522 images are made for. Below 768px, movies use `repeat(3, 1fr)` and shows `repeat(2, 1fr)` with a 12px gap. Tiles drop their fixed width and height, and posters go to `width: 100%; height: auto`. Movie tiles already carry `width="174" height="261"`, so the browser keeps them 2:3 without a rule; show posters carry `200x200`, which keeps them square. The tiles' `contain-intrinsic-size` (174x303 today) gets a phone value near the shrunk tile's size, so off-screen tiles that are skipped don't make the page jump.

- *Alternative: `repeat(auto-fill, minmax(100px, 1fr))` everywhere.* Rejected: it stretches desktop tiles between column counts, and the column count on a phone would depend on the exact screen width. A fixed 3 or 2 is predictable from 320px to 767px.

### The pinned phone bar: CSS moves the search into the navbar row

Below 768px, and on any screen 500px tall or less (a phone held sideways, where the desktop header would cover a third of the height), `#search-boxes` stops being fixed and flows at the top of the page, so the Add, Movies or TV Shows, and Library, Unwatched and 4K controls scroll away with the grid. `#filter-input` alone becomes `position: fixed` in the navbar's row, between the logo and the menu button. A visitor's Sign in button is wider than the menu button, so `body:has(#sign-in)` gives the search a larger right offset. The phone navbar also hides "Signed in as" and the TMDB logo, and keeps `.navbar-right` on the same row. The search input gets a 16px font on phones, because iOS zooms the page in when an input under 16px gets focus.

- *Alternative: move the search form into `layout.erb`'s navbar.* Rejected for now: the form is in three views (`users/show.erb`, `shows/show.erb`, `movies/show.erb`) and wired up by `filters.js`. Moving it changes markup, scripts and the desktop header, all for the same result on screen.

### The drawer and the details dialog share `#meta-data`'s fix

`#meta-data` changes from `width: 1170px` to `max-width: 1170px; width: 100%`, centered. That one rule caps the drawer's content on wide screens and lets it shrink on a phone, in the drawer and in the dialog. The drawer and dialog posters (447px and 340px) get `max-width: 100%; height: auto`. On a phone, `.modal-lg` loses its 1100px width (and the old `max-width: 400px` rule in both `modals.css` files is replaced): the dialog takes the screen width less 8px on each side and `max-height: calc(100dvh - 16px)` with `overflow-y: auto`, so its content scrolls inside it and the × stays at its top. The sign-in dialog's fixed width becomes a `max-width`.

### Tests: one new spec file that sets its own window sizes

`e2e/responsive.spec.js` sets the window per `describe` with `test.use({ viewport, isMobile, hasTouch })`: 390x844 with touch for the phone, and 2560x1440 for wide. A second Playwright project would run every existing spec at phone size, and those specs assume desktop rows of 7. The config keeps its single project; only its comment changes, since the pages are no longer a fixed 1386px.

The checks are measured from the page, not from screenshots: `document.documentElement.scrollWidth <= innerWidth` for no sideways scroll, posters per row counted by matching `offsetTop`, bounding boxes for the pinned bar, drawer and dialog. The phone checks run once with each theme, by answering the request for one theme's stylesheet with the other's, because every rule removed from one theme folder has to be removed from the other. The first test written, "no browsing page scrolls sideways at 390px", fails on every page today for the right reason.

### Asset versions

`dark.css` and `default.css` import `responsive.css` without a version, because it is a new file. Every changed imported file gets its `?v=` raised, as `page-assets` requires: `movies.css` and `modals.css` in both themes, and `drawer.css`. Files imported without a version today (`layout.css` in both themes, `navigation.css`) get `?v=1`.

## Decisions from hands-on testing

Checking the branch on a real phone with the real collection showed problems the seed data never hit: long titles, movies with a studio, real artwork, and turning the phone. These decisions came out of fixing them.

### Grid columns that can't grow: `minmax(0, 1fr)`

A grid track sized `1fr` won't shrink below its content. A long show title that doesn't wrap widened a phone column, and a 770px rule under a movie's studio heading widened the drawer's single column, carrying the details off the screen. The phone grids use `repeat(3, minmax(0, 1fr))` and `repeat(2, minmax(0, 1fr))`, and the drawer's `.info` uses `grid-template-columns: minmax(0, 1fr)`, so no child can widen a track past the window.

### The drawer keeps the page's side margins

`.info-wrapper` gets `padding-inline: var(--gutter)`. Before, the drawer's details only had side space when the window was wider than the details' maximum width, so at 926px they touched the screen's edges.

### The show drawer's width is a maximum, and its poster may shrink

`_show_info.erb` set `style="width: 1386px"` on its `#meta-data`, and the new `max-width: 1170px` overrode it, narrowing the poster column under its 447px poster. The inline style becomes `max-width: 1386px`. Below about a 1500px window the poster column is still narrower than 447px, so the poster gets `max-width: calc(100% + 15px)`: as far into the column's right padding as it always reached, and no further.

### Phone drawer pieces wrap instead of squeezing

On a phone, `.description-info` (runtime, year, genre, rating and HD badges, stars) becomes a wrapping flex row whose items don't shrink, so badges keep their size and the stars stay on one line. The show edit button, which floats right with a negative bottom margin, gets a positive margin, and the poster clears it, so it sits above the poster.

### Episode runtime and "more" below 1200px

On wide screens the runtime and "more" hang 40px into the column beside the episode list, with "more" pulled up beside the one-line plot. The show drawer's Bootstrap `col-lg-*` columns stack below 1200px, so there they get `margin-right: 0`, and "more" goes below the plot. On a phone the plot shows up to three lines (`-webkit-line-clamp: 3`), which `.active` lifts.

### "more" appears only when a plot is cut off

The server used to add "more" to any plot over 130 characters. Whether a plot is cut off depends on the screen, so plots that fit showed a "more" that revealed nothing, and shorter plots cut off on a narrow screen had none. The server now adds the toggle to every episode with a plot, and `credits.js` hides it while its plot isn't overflowing. It checks on window resize, and through a `MutationObserver` on the page, because episodes arrive by several paths: opening or switching the drawer, switching a season, and creating a show.

### The drawer moves when the window's width changes, and only then

Turning a phone changes how many posters fit a row, which left the drawer splitting a row or under the wrong one. On `resize`, `drawer.js` takes the drawer out of the grid, since its own full-width row would end the poster's row early, finds the row's new end, and puts it back. It skips resizes that don't change the width: iPhone Safari resizes the window as its address bar grows and shrinks during a scroll, and moving the drawer then would lay out the whole grid mid-scroll and drop focus.

### Library and Clear find the collection's owner on the page

Library and Clear took the owner's id from session storage, which only a search had filled, so in a new tab they requested `/users/null`. This was a gap on master too. A shared `collectionOwner` helper in `filters.js` reads it from the posters (each tile's id is its owner's), keeps storage as the fallback when a filter leaves no posters, and serves search, Library and Clear.

### Phone posters keep a fixed shape

The fallback image shown for a failed poster is 140x208, not quite 2:3. With `height: auto` it made such tiles 3px shorter, which threw off the placeholder height for tiles not yet drawn and made the page's height drift while scrolling. Phone posters get `aspect-ratio: 2 / 3` (movies) and `1` (shows).

## Risks / Trade-offs

- [The phone search box sits over the navbar by fixed offsets, so a logo or button change could make them overlap] → The pinned-bar test checks that the logo, the search box and the menu or Sign in button don't overlap, signed in and signed out.
- [Rules deleted from only one theme folder] → The phone checks run under both themes.
- [Owner tools (Add Movie strip, edit dialogs) look rough on a phone until the follow-up] → They lose only fixed widths here, so they don't break the no-sideways-scroll rule; pinch zoom works again for anything cramped.
- [Wide windows paint up to about twice as many tiles at once (15 per row at 3840px against 7 today)] → Tiles already use `content-visibility: auto`. The visual pass checks the drawer animation at 2560px against the `detail-drawer` frame-time requirement.
- [`:has()` and `dvh` need Safari 15.4+ / Chrome 105+ / Firefox 121+] → The site already relies on `<dialog>`, `@starting-style` and `:has()` in `dialog.css`, so this adds no new browser floor.
- [Hover-only details, like the play overlay on the drawer's poster, have no hover on touch] → Tapping the poster still follows its link. Nothing is lost, it just isn't shown first.

## Migration Plan

CSS and one meta tag, so no data migration. Deploy with the usual dated release tag. To roll back, redeploy the previous tag; the versioned stylesheet URLs make browsers pick up either version without a hard reload.
