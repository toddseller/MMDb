# Tasks

Groups 2 to 5 work test-first: write the test named in the task, run it and see it fail for the reason given, make the smallest change that passes, then run the whole suite (`npm test`, `npm run typecheck`, `npx playwright test`, and the Ruby specs).

## 1. Prototype the timing and look

- [x] 1.1 Build a throwaway single-file page outside the repo: a grid of placeholder posters with simulated lazy loading and sort names across most letters (none under Q), grown to about 4,600 movies at the owner's request, a 50px pinned bar below 768px, and the rail with jump-then-glide, the phone fade and drag. Verify the owner can try it at desktop and phone sizes (the Safari check moved to the real build, in 6.2).
- [x] 1.2 Log each jump's time and the posters it loads in the prototype, and try glide distances of 0.75, 1, 2 and 3 screens on about 4,600 movies. Verify the owner has chosen a distance and it is recorded in design.md (two screens, chosen 2026-10-25). Chrome and WebKit times on the real library were measured in 6.2.
- [x] 1.3 Show the prototype to the owner at desktop and phone sizes and agree the rail's width, letter size, desktop and phone placement, fade timing and the threshold of one screen. Verify by recording any changed values in design.md and the spec before group 2 starts.

## 2. Letters on tiles

- [x] 2.1 Add a Ruby spec for a helper that maps a sort name to its rail letter: `matrix` gives `m`, `Picard` gives `p`, `élan` gives `e`, `Ørsted` gives `o`, `Æon flux` gives `a`, and `12 angry men`, blank and nil give `#`. Verify it fails because the helper doesn't exist, then add the helper to `app/helpers/` and verify it passes.
- [x] 2.2 Add view specs that each of the six tile partials (`_my_movies`, `_movie_list`, `_filtered_list`, `_my_shows`, `_show_list`, `_updated_show_list`) renders `data-letter` from the title's sort name, including "The Matrix" as `m` and a show whose sort name was edited. Verify they fail, add the attribute to each partial, and verify they pass.

## 3. Rail markup and placement

- [x] 3.1 Add view specs that a user's movies, a user's shows and a movie collection's own page render a `nav` named "Jump to letter" with 27 links, `#` then A to Z, and that the home page renders none. Verify they fail, add the `_letter_rail` partial and include it in `users/show.erb`, `shows/show.erb` and `movies/show.erb`, and verify they pass.
- [x] 3.2 Seed a third e2e user with a long movie collection (about 80 titles across most letters, none under Q, including "The Matrix" and "12 Angry Men") and a long show collection, and export it from `e2e/fixtures.js`. Verify existing specs that count USER's or OTHER's titles still pass.
- [x] 3.3 Add Playwright checks: at 1500x1000 the rail is visible at the top of the page, runs from just below the top bar to near the bottom of the window, sits within the right margin and overlaps no poster, and Q is drawn in the same colour as P; at 390x844 the rail runs from just below the pinned bar to near the bottom of the screen and the page doesn't scroll sideways with it shown; at 926x428 every other letter shows and the rail fits below the pinned bar with no letters overlapping. Verify they fail, add the rail's styles to `responsive.css` (fixed placement, full-height rail with letters sharing the height, 13px on desktop and 12px on phones, muted letters with an accent hover on letters with titles, phone translucency, every other letter at 500px tall or less, `scroll-margin-top` on tiles under the pinned bar), raise the `?v=` of changed imports, and verify they pass under both themes.

## 4. Showing and hiding

- [x] 4.1 Add jsdom tests for `public/js/mmdb/letter-rail.js`: letters with no titles get `aria-disabled`, `tabindex="-1"` and a "no titles" label that follow the tiles on the page; on a phone the rail is marked shown only past one screen of scrolling and on a page at least three screens tall (desktop shows it from CSS, checked in 3.3); and a grid or whole page replaced refreshes both. Verify they fail, write the module with the scroll check and the batched `MutationObserver`, start it from `public/js/main.js`, and verify they pass along with `npm run typecheck`.
- [x] 4.2 Add jsdom tests for the phone fade: visible state cleared 2.5s after the last scroll, restarted by each scroll, and kept while a pointer is down on the rail or focus is within it (desktop never fades because the script leaves its visibility to CSS; checked in 4.3). Verify they fail, add the timer behind `matchMedia('(max-width: 767px)')`, and verify they pass.
- [x] 4.3 Add Playwright checks with the long collection: at 1500px the rail is shown at the top, after scrolling, after 3 seconds still, and after a search leaves a short grid; at 390px it is hidden at the top, shown after scrolling one screen, hidden again at the top, not shown after a search leaves a short grid, shown again after Clear, and gone 4 seconds after scrolling stops. Verify they pass.

## 5. Jumping

- [x] 5.1 Add jsdom tests with stubbed `scrollTo` and tile positions: a far jump makes an instant call two screens short of the target (from either direction) then a smooth call to it; a jump of less than two screens makes only the smooth call; reduced motion makes one instant call; choosing a letter with no titles makes no call; an open drawer is closed with `close(true)` first. Verify they fail, implement the jump, and verify they pass.
- [x] 5.2 Add jsdom tests for dragging: pointer positions map to letters by proportion of the rail's height, including letters hidden on short screens; moves jump instantly and pass over letters with no titles; a tap without a drag glides; the click after a touch tap is ignored. Verify they fail, implement them, and verify they pass.
- [x] 5.3 Add Playwright checks with the long collection: choosing M puts "The Matrix"'s row at the top of the visible grid, below the pinned bar on a phone; A to W glides the last two screens and requests no poster more than a few screens from W; clicking Q leaves the page where it was, and Tab from P skips to R; choosing a letter with a drawer open closes it; Tab to the M link and Enter jumps; dragging from A to M on a phone ends at M. Verify they pass.

## 6. Integration

- [x] 6.1 Run the whole suite (`npm test`, `npm run typecheck`, `npx playwright test`, Ruby specs) and verify it passes.
- [x] 6.2 Check on the local dev server (port 4666) with real data (4,526 movies), in Chromium and WebKit, at 1500px, 390px and 926x428, in both themes: the rail's look, the glide, the phone fade and drag. Verify by showing screenshots to the owner and getting approval before the first commit (approved 2026-10-25 after the owner tried it on an iPhone in Safari).

## Workflow follow-up

- Work on a feature branch, run the ponytail review on the diff before the first commit, and archive the change in the same PR.
