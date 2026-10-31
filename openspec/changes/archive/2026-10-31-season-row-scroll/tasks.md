# Tasks

## 1. Share the search panel's arrow logic

- [x] 1.1 Move `preview.js`'s arrow toggle (the `WeakMap`, the start and end tests, the fade) and its page scroll into `public/js/mmdb/scroll-arrows.js` as `updateArrows(panel, left, right, { instant })` and `scrollPage(panel, direction)`, with `preview.js` calling them; verify every test in `spec/js/preview.test.js` passes unchanged, including "arrows show only while there is more to scroll that way" and "an arrow that starts fading out comes back"
- [x] 1.2 Add `spec/js/scroll-arrows.test.js` covering `instant` (arrows set without a fade); show it failing before `instant` exists, then add it and verify it passes

## 2. The season line and its arrows

- [x] 2.1 In `spec/js/season-row.test.js` (jsdom, sizes faked as in `preview.test.js`), add tests that `placeSeasons` with no `keep` scrolls a 48-season line so the active season 48 clears the right arrow and shows only the left arrow, leaves the line at 0 when the active season is 3, restores a given `keep` position, and does nothing for content with no season line; show them failing, then write `placeSeasons` in `public/js/mmdb/season-row.js` and verify they pass
- [x] 2.2 Add tests that clicking `.season-arrow` scrolls the line by its visible width (smooth, or `auto` under reduced motion) and that a `scroll` on the line updates the arrows; show them failing, then write `init` (click through `on`, capture-phase `scroll`, window resize) using `scroll-arrows.js`, register it where the other modules are initialised, and verify they pass
- [x] 2.3 In `_show_info.erb`, wrap `#season-default` in `.season-row` with two `button.season-arrow` elements (`type="button"`, `aria-label` "Earlier seasons" and "Later seasons", hidden at first); in `movies.css`, make `#season-default` a one-line flex scroll container with a hidden scrollbar, `.season-row` `position: relative; min-width: 0`, and the arrows fade from `var(--surface)`; verify the Ruby suite passes (the drawer view tests render this partial)

## 3. Place the line wherever a show's details arrive

- [x] 3.1 In `spec/js/drawer.test.js`, add tests that opening a drawer and `show` to another poster in the same row place the line on the active season, and that `keepOpen` with new details keeps the old scroll position; show them failing, then call `placeSeasons` from `insert` and `swap` (reading the old position in `swap` and passing it only from `keepOpen`) and verify they pass
- [x] 3.2 In `spec/js/show-edit.test.js`, add a test that a season switch keeps the line's scroll position; show it failing, then read the old position in `showSaved` and pass it to `placeSeasons`, and verify it passes

## 4. Real layout

- [x] 4.1 Add a 48-season show to `e2e/seed.rb` with season 48 active, and a Playwright test in `e2e/shows.spec.js` at 1500px that checks the seasons sit on one line, season 48 is in view with only the left arrow, a left-arrow click scrolls the line and shows the right arrow, clicking a season keeps the line where it was, and the 3-season Harbor Lights shows no arrows; show the new test failing first, then verify it passes after groups 2 and 3
- [x] 4.2 Run the whole Playwright suite and adjust any test whose counts the new seeded show changes, and verify it is green
- [x] 4.3 Take screenshots of the 48-season drawer in the dark and light themes, at the start and scrolled, plus a phone-width one, and show them to the user for approval

## 5. Integration

- [x] 5.1 Run `bundle exec rspec`, `npm test` and `npm run typecheck`, and verify all pass
- [x] 5.2 Run `openspec validate season-row-scroll --strict` and verify it passes

## Workflow follow-up

- Run `ponytail:ponytail-review` on the diff and wait for the user to pick fixes before the first commit.
- Archive the change in the same PR, then open the PR with `gh`.
