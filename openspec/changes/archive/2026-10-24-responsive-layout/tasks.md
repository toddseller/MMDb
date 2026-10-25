# Tasks

Each group works test-first: write the e2e checks named in the task, run `npx playwright test e2e/responsive.spec.js` and see them fail for the reason given, make the CSS change, then run the whole suite (`npm test`, `npm run typecheck`, `npx playwright test`, and the Ruby specs).

## 1. Fluid page, zoom and shared stylesheet

- [x] 1.1 Create `e2e/responsive.spec.js` with a phone `describe` (390x844, `isMobile`, `hasTouch`) asserting `scrollWidth <= innerWidth` on the home page, a signed-in user's movies and shows, another user's movies, a visitor's view of a collection, and a movie's own page; and a check that the viewport meta has no `maximum-scale` or `user-scalable=no`. Verify every check fails today, with the page about 1386px wide and `maximum-scale=1` present.
- [x] 1.2 Remove `maximum-scale=1` from `app/views/layout.erb` and verify the viewport meta check passes.
- [x] 1.3 Add `public/css/responsive.css`, imported last by `dark.css` and `default.css`, with `--gutter` as the body's `padding-inline`: 16px below 768px, and `clamp(40px, (100vw - 1640px) * 0.22, 376px)` from 768px up. Add checks that the body's side padding is 40px at 1500px, about 202px at 2560px and 376px at 3840px, and see them fail first. Delete the fixed `1386px` widths and the `100vw`/`calc()` stretches from both themes' `layout.css` and `movies.css` (`body`, `#search-wrapper`, `.preview-wrapper`, `#search-boxes`, `#profile-wrapper`) and from `.info` and `.info-wrapper` in `drawer.css`, using a negative `--gutter` margin for full bleed. Raise the changed imports' `?v=` per design.md. Verify the sideways-scroll checks pass for every page except the ones covered in later groups, and that `e2e/drawer.spec.js` still passes at 1500px with rows of 7.
- [x] 1.4 Update the comment on the Playwright project in `playwright.config.js`, which says the pages are a fixed 1386px wide, to give the real reason for 1500px (the drawer specs expect rows of 7). Verify `npx playwright test --list` still runs one project.

## 2. Grids

- [x] 2.1 Add checks: 3 movies per row and 2 shows per row at 390px, each movie poster 1.5 times as tall as wide and each show poster square, titles within their tiles; 10 movies and 9 shows per row at 2560x1440, and still at 2545x1440, the width left when a classic scrollbar takes 15px (headless Chromium hides scrollbars, so the narrower window stands in for one). Verify they fail: the phone rows hold 1 or 2, and the wide rows hold 7 movies and 6 shows.
- [x] 2.2 In `responsive.css`, below 768px, give `#movie-list` `repeat(3, 1fr)` and `#show-list` `repeat(2, 1fr)` with a 12px gap, drop the tiles' and posters' fixed sizes, and set a phone `contain-intrinsic-size`. Verify the grid checks pass, and that scrolling a phone grid from top to bottom doesn't make the page jump.

## 3. Pinned phone bar and menu

- [x] 3.1 Add checks at 390px: after scrolling a signed-in user's movies down 3 screens, the search box and menu button are on screen at the top and the Library link is not; typing `amb` shows only Amber; for a visitor, the logo, search box and Sign in button don't overlap; the menu and Profile submenu open within the screen and tapping TV Shows shows the show grid; "Signed in as" is hidden. Verify they fail against today's stacked, fully fixed header.
- [x] 3.2 In `responsive.css`, below 768px: make `#search-boxes` static, fix `#filter-input` into the navbar row between the logo and the menu button with a wider right offset under `body:has(#sign-in)`, give the search input a 16px font, hide `.navbar-text` and `#tmdb`, keep `.navbar-right` on the navbar's row, and fit `#drop-down` to the screen. Move the fixed values these replace out of `navigation.css` only if they conflict, and raise its `?v=`. Verify the 3.1 checks pass and the desktop header at 1500px is unchanged (`e2e/navigation.spec.js` and `e2e/filters.spec.js` pass).

## 4. Drawer, details dialog, sign-in and home page

- [x] 4.1 Add checks: at 390px, a tapped movie's drawer has its poster above its title, both within the screen; at 2560px, the drawer's details are no wider than at 1500px and are centered under the row; at 390px, the details dialog opened from the home page is no wider than the screen with its × on screen and scrolls inside itself, and the sign-in dialog's fields and button are within the screen; the home page shows popular movies two per row with the user list below the recent movies; after choosing an actor from a movie's details, the photo and name are within the screen. Verify they fail where they should (the 1170px `#meta-data`, the 1100px `.modal-lg`, the 447px and 340px posters, the 4em name).
- [x] 4.2 Change `#meta-data` to `max-width: 1170px; width: 100%`, centered, and make the drawer and dialog posters `max-width: 100%; height: auto`, in both themes' `movies.css` and `modals.css`. Below 768px, size `.modal-lg` and the sign-in dialog to the screen less 8px a side with `max-height: calc(100dvh - 16px)` and `overflow-y: auto`, replacing the old `max-width: 400px` rule in both `modals.css` files, and shrink the filmography header. Raise the changed imports' `?v=`. Verify the 4.1 checks pass and `e2e/drawer.spec.js`, `e2e/dialogs.spec.js` and `e2e/credits.spec.js` still pass at 1500px.

## 5. Both themes and visual pass

- [x] 5.1 Run every phone check in `e2e/responsive.spec.js` under both themes by answering the request for one theme's stylesheet with the other's. Verify all pass under both; any failure means a rule was removed from only one theme folder.
- [x] 5.2 Run the whole suite (`npm test`, `npm run typecheck`, `npx playwright test`, Ruby specs) and verify it passes.
- [x] 5.3 Visual pass in a browser at 390px, 1500px and 2560px, in both themes: home page, a collection with the drawer open, the details dialog, the menu, signed in and signed out. Check that the drawer animation stays smooth at 2560px with a large collection, as the `detail-drawer` spec requires. Record anything off as a fix or as a note for the owner-tools follow-up.

## 6. Fixes from review and hands-on testing

- [x] 6.1 Keep the poster-fitting rule to phones, so a show's drawer poster stays 447px on desktop; verified by "a show drawer's poster keeps its 447px size" at 1500 and 2560px, which failed at 370px first.
- [x] 6.2 Make the phone tiles' placeholder height follow the window width; verified by the page-height checks at 390 and 740px, scrolling by wheel, which failed by 561px at 740px first.
- [x] 6.3 Make the show drawer's inline width a 1386px maximum, and let its poster shrink to its column plus the column's right padding; verified by the show poster checks at 1300, 1500 and 2560px, which failed with the poster 57px into the details first.
- [x] 6.4 Give the drawer's grid column `minmax(0, 1fr)`, cap its rule lines on a phone, and let the info row wrap as whole pieces; verified by "a drawer's details fit the screen when the movie has a studio" (786px wide first) and "a drawer's badges and stars keep their size and stay in one piece" (HD badge 12px first).
- [x] 6.5 Use `minmax(0, 1fr)` phone grid columns; verified by "a long title stays inside its movie tile" and "... show tile", which failed at 524px and 441px first.
- [x] 6.6 Have Library and Clear take the collection's owner from the page through a shared `collectionOwner` helper; verified by "Library restores the full collection in a new tab" and "Clear ...", which failed showing 1 movie first.
- [x] 6.7 Put the show edit button above the poster on a phone, and keep episode runtimes and "more" on screen below 1200px with "more" under its plot; verified by the owner's show drawer check, the phone runtime check (399px first) and the sideways-phone episode check (951px first).
- [x] 6.8 Show plots up to three lines on a phone, and have every episode get "more" from the server, shown only while its plot is cut off; verified by "a show drawer offers more only for a plot that is cut off" and the three-line plot check, which failed first, plus the re-recorded show info page-text snapshot.
- [x] 6.9 Pin phone posters to 2:3 and square, so the 140x208 fallback can't change a tile's height; verified by repeating the page-height checks 4 times each, which failed by 33px in some runs first.
- [x] 6.10 Give the drawer's content the page's side margins at every width; verified by the sideways-phone margin checks for movies and shows, which failed at 0 and 5px first.
- [x] 6.11 Move an open drawer to its poster's new row end when the window's width changes, and only then; verified by the two turning-phone checks (failed first, after tightening them to require a full row) and "leaves an open drawer alone when only the height changes" (focus lost first).
- [x] 6.12 Use the compact pinned bar on screens 500px tall or less; verified by "pins only the compact bar, so the filters scroll away", which failed with the search at 105px first.
- [x] 6.13 Run the whole suite and check each fix against the real collection on the local server at 428x926 and 926x428; verified by the suite passing and the screenshots.

## Workflow follow-up

- Work on a new feature branch off `master`, not on `vanilla-js-remove-jquery`.
- Run `/ponytail:ponytail-review` on the diff before the first commit.
- Archive the change as the last commit of the change's PR, open the PR with `gh`, and leave merging to the owner.
- Deploy with a `vYYYY.MM.DD.N` release tag.
- Start the owner-tools phone layout change, then the letter jump rail change.
