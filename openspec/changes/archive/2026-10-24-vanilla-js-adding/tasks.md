# Tasks

## 1. Browser tests for what isn't covered yet

- [x] 1.1 In `e2e/seed.rb`, record three more responses into `e2e/.generated/`:
  - `movie_search_many.json`: twelve canned results, more than fit across the panel
  - `movie_search_markup.json`: one result titled "Nova <i>Drift</i>"
  - `movie_update_search.json`: the edit form's search (`/movies/update`) for Edit Target, with the canned result
- [x] 1.2 Add `e2e/adding.spec.js`, signed in, with searches answered from recordings:
  - **Dismiss:** after a search, dismiss closes the panel, hides the dismiss control and brings back Add Movie with no search box.
  - **Arrows:** with many results, only the right arrow shows. A click scrolls by the panel's width and shows the left arrow. At the end the right arrow hides.
  - **Whole season:** picking Harbor Lights' season, then Add All Episodes, closes the panel, and the show's details list 1x2.
  - **Failed show search:** a 500 shows Create New Show.
  - **Failed movie search:** a 500 shows the placeholder image.
  - **Markup title:** with the add request held back, the adding message shows "Nova <i>Drift</i>" as text with no `i` element.
  - **Edit form search:** Search in Edit Target's edit form fills the panel with the recorded result.
- [x] 1.3 Run them against today's code:
  - dismiss, arrows, whole season, edit form search and both failure tests pass
  - the markup test fails, because an `i` element is created

## 2. motion.js slides

- [x] 2.1 Add to `spec/js/motion.test.js` and show the new tests failing:
  - `slideDown` sets the display and animates height from 0 over the given time
  - `slideUp` animates height to 0, then hides the element
  - both act at once under reduced motion or without `el.animate`
  - `fadeIn` shows with a given display
- [x] 2.2 Add `slideDown`, `slideUp` and `fadeIn`'s `display` argument to `public/js/mmdb/motion.js`. Run `npm test` and `npm run typecheck`.

## 3. preview.js

- [x] 3.1 Write `spec/js/preview.test.js` and show it failing. It uses the page markup from `users/show.erb` and `shows/show.erb`, stubs `fetch`, `el.animate` is absent so changes are instant, and `scrollWidth`/`clientWidth` are stubbed. It checks:
  - Add Movie and Add TV Show swap for the search box
  - a search clears the box, shows "Searching Our Database..." and the dismiss control, requests `/movies?query=…` (or `/shows`), and renders the results centred up to six and spread above that, with the table's values for each layout
  - a failed movie search shows the placeholder; a failed show search shows Create New Show
  - arrows show and hide by scroll position, and a click scrolls by `clientWidth`
  - adding a movie posts the form plus `filter`, shows the adding message as text, then closes the panel, restores Add Movie, and replaces the grid and footer count
  - picking a season lists the episodes with the episodes layout; adding an episode or a whole season updates the show list and footer
  - dismiss closes everything and restores the add button
  - `window.preview.search(url)` and `window.preview.close()`
- [x] 3.2 Write `public/js/mmdb/preview.js` and call its `init` from `main.js`. Type `window.preview` in `legacy.d.ts`.
- [x] 3.3 In `mmdb.js`:
  - remove the functions the proposal lists, the `lastPos` and `first` variables, and the `#dismiss`, `#scroll-right`, `#scroll-left`, `#add`, `#add-show`, `#movie-search`, `#show-search`, `#create-movie`, `#create-show`, `#create-episode` and `#more` bindings
  - make `updateDatabase` call `window.preview.search`, and `displayEditForm` and `displayCreateShow` call `window.preview.close()` in place of their panel lines
  - give `deleteMovie` its own success handler for the grid and count, since `listMovie` goes
- [x] 3.4 Delete the `#search-year` rule from both themes' `movies.css`, and raise their imports in `default.css` and `dark.css` to `?v=4`.
- [x] 3.5 Run `npm test` and `npm run typecheck`, then every browser test: the markup test now passes.

## 4. Check and finish

- [x] 4.1 Break checks: disable the search submit, the add submit, dismiss and the arrow click in `preview.js` in turn, and confirm a browser test fails each time.
- [x] 4.2 Run the full suite: `bundle exec rspec`, `npm test`, `npm run typecheck` and `npx playwright test`.
- [x] 4.3 Update the README's list of browser-tested flows.
- [x] 4.4 Run `openspec validate vanilla-js-adding --strict`.

## Workflow follow-up

- Work on a feature branch. Archive as the change PR's last commit, then open the PR with gh.
- After the merge, the user deploys with the next tag from `gh release list`. Then validate on mmdb.online without adding anything to the collection: a movie search with its arrows and dismiss, a show search through to the episode list, and dismiss.
