# Tasks

## 1. Make room for the open panel

- [x] 1.1 Add `<div id="panel-room"></div>` right after `#search-boxes` in `app/views/users/show.erb`, `app/views/movies/show.erb` and `app/views/shows/show.erb`, hidden by a `#panel-room { display: none }` rule in `public/css/movies.css` (the content security policy spec forbids `style` attributes in views), and add it after the panel markup in `spec/js/preview.test.js`'s `collection` fixture; verify `bundle exec rspec` passes
- [x] 1.2 In `spec/js/preview.test.js`, with the band stubbed as `position: fixed`, its height growing by 350px when the panel shows, and `scrollY`/`scrollBy` stubbed, add tests that: a search at `scrollY` 0 slides the spacer open to 350px (one `animate` call) and doesn't scroll; a search at `scrollY` 800 shows the spacer at 350px with no animation and scrolls by 350; dismissing at `scrollY` 1150 hides the spacer at once and scrolls by -350; dismissing at 0 slides it shut; and a band that isn't fixed (phone) leaves the spacer hidden and never scrolls. Show them failing, then add the spacer handling to `showPanel` and `close` in `public/js/mmdb/preview.js` and verify they pass
- [x] 1.3 In `spec/js/drawer.test.js`, add a test that clicking a poster while the panel is open with the spacer showing hides the spacer at once (no animation on it) before the details request resolves; show it failing, then have `togglePoster`'s close remove the room at once, and verify it passes with the rest of `npm test`

## 2. End-to-end

- [x] 2.1 In `e2e/adding.spec.js` at 1500px, add tests that: after a movie search's results show and the panel finishes opening, the first row is wholly below the panel and clicking Birch opens its details and closes the panel; scrolled to the fourth row, a search and then dismissing it each leave a fourth-row poster at the same screen position; and after opening the panel scrolled down, scrolling to the top shows the first row below it. Add a 390px test that a search pushes the grid down by the band's growth only. Show the 1500px tests failing first, then verify the whole Playwright suite passes after group 1
- [x] 2.2 Take dark and light screenshots at 1500px of the movies page with the search panel open at the top of the page, and the same scrolled down, plus one at 390px, and show them to the user for approval

## 3. Verify

- [x] 3.1 Run `bundle exec rspec`, `npm test` and `npm run typecheck`, and verify all pass
- [x] 3.2 Run `openspec validate first-row-under-panel --strict` and verify it passes

## Workflow follow-up

- Run `ponytail:ponytail-review` on the diff and wait for the user's picks before committing.
- Commit the code, then archive the change as `Archive first-row-under-panel`, and open one PR.
