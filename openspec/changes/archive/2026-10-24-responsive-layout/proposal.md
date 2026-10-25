# Proposal

## Why

Every page is laid out for a fixed 1386px width. On a phone the site loads zoomed out to about a quarter size, and the viewport meta's `maximum-scale=1` stops pinch zoom, so browsing a collection on a phone barely works. The same fixed width caps a 27" 4K monitor at 7 movies or 6 shows per row, leaving most of the screen empty. With jQuery and Bootstrap's JavaScript gone, the remaining layout is plain CSS and can follow the window.

## What Changes

- Pages fill the window at every width, from a 390px phone to a 3840px monitor. No page scrolls sideways. Side margins are 16px on a phone and 40px on a laptop, and widen on large screens: about one poster's width at 2560px, and two posters' width from about 3350px.
- Pinch zoom works again (`maximum-scale=1` is removed).
- Movie and show grids fit as many columns as the window holds: about 3 movies or 2 shows on a phone, 7 movies at today's 1500px desktop window, 10 movies or 9 shows on a 2560px screen, and 15 movies at 3840px. Tiles keep their desktop size; on a phone they shrink to fit 3 across.
- On a phone, upright or on its side, the collection pages pin one compact bar: the logo, the collection search and the menu (or Sign in). The Add, Movies/TV Shows and Library/Unwatched/4K controls sit at the top of the list and scroll away with it.
- The details drawer stacks its poster above the details on a phone, keeps the page's side margins, and keeps its content to a readable width, centered, on wide screens. It moves to the right row when the phone turns.
- An episode plot shows "more" only when it is actually cut off, judged on the screen it's shown on; on a phone plots show up to three lines.
- Library and Clear restore the full collection in a new tab too. They failed there before, on master and in production, until a search had been made.
- A movie's details dialog fits a phone screen.
- The home page's popular and recent movies stack above the user list on a phone.
- The filmography header (a person's photo and name, shown after clicking a credit) fits a phone.

## Out of scope

- Phone layouts for the owner tools: Add Movie and Add TV Show with their search results strip, the movie and show edit dialogs, artwork upload, and adding episodes. They stay reachable by pinch zoom; a follow-up change makes them fit.
- The letter jump rail for long collections, planned as the next change.
- Filling a wide row on the home page, which still shows 6 popular and 6 recent movies.

## Capabilities

### New Capabilities
- `page-layout`: how pages fit the window at any width: gutters, zoom, no sideways scrolling, grid columns, and what stays pinned at the top on a phone.

### Modified Capabilities
- `detail-drawer`: adds how the drawer's content is laid out on a phone and on wide screens, and that it follows a turned phone.
- `dialogs`: adds that a movie's details dialog fits a phone screen.
- `collection-filters`: Library and Clear work in a new tab that hasn't searched.
- `details-links`: "more" depends on whether a plot is cut off on screen, not on its length.

## Impact

- **Views:** `app/views/layout.erb` (viewport meta); `app/views/partials/_show_info.erb` (its width becomes a maximum, and every episode with a plot gets "more").
- **Scripts:** `public/js/mmdb/filters.js` (Library and Clear find the collection's owner on the page), `drawer.js` (an open drawer follows a width change), `credits.js` ("more" shows only for a cut-off plot).
- **Stylesheets:** fixed widths removed from `public/css/themes/dark/` and `public/css/themes/default/` (`layout.css`, `movies.css`, `modals.css`), `public/css/navigation.css`, `public/css/drawer.css`; a new shared stylesheet for the width-dependent layout, imported by `dark.css` and `default.css`. Changed imports get raised `?v=` versions, as the `page-assets` spec requires.
- **Tests:** a new Playwright spec run at phone, sideways-phone and wide window sizes; two new Library and Clear tests in `e2e/filters.spec.js`; the show drawer's page-text snapshot gains "more". The existing desktop project keeps its 1500x900 window, where the grid still holds 7 movies per row.
- **No server routes, API or data changes.**
