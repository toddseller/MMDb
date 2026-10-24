# Tasks

## 1. Tile-sized Apple posters

- [x] 1.1 Add `spec/movie_spec.rb` for `Movie#thumbnail`:
  - an Apple `2000x3000.jpg` and an `800x1200.jpg` become `348x522bb.jpg`
  - a `.png` keeps its extension
  - TMDB, `cdn.myflix.stream` and nil are returned unchanged, with nil as `''`

  Show it failing, then add `thumbnail` to `Movie` until it passes

## 2. Native lazy loading in every grid

- [x] 2.1 Add request specs that render each movie grid and check every poster has `loading="lazy"`, a `src` ending in `348x522bb.jpg` for an Apple poster, and no `data-original`. Cover the movies page (`GET /users/:id`), the unwatched list, a search, and the home page's top and recent movies. Change the `grid_responses_spec.rb` show expectations the same way (no `data-original`, `loading="lazy"`), so the episodes route is covered too. Show them failing
- [x] 2.2 Switch `_my_movies`, `_movie_list`, `_filtered_list`, `_top_movies`, `_show_list` and `_updated_show_list` to `src` plus `loading="lazy"` with `thumbnail`, dropping `class="lazy"` and `data-original`. Verify the specs pass

## 3. Remove the lazyload plugin

- [x] 3.1 Add checks that no page references `jquery-lazyload.js` and that `mmdb.js` and `application.js` don't call `.lazyload(`. Update `page_assets_spec.rb` to expect 4 versioned assets. Show them failing, then remove the script tag, the four calls and `public/js/jquery-lazyload.js`. Verify they pass

## 4. Rendering cost

- [x] 4.1 Add stylesheet checks to `spec/detail_drawer_spec.rb`:
  - neither theme's `movies.css` sets a transform on `img`
  - `drawer.css` gives `#movie-list > .index-preview` `content-visibility: auto` with `contain-intrinsic-size: 174px 303px`, and the open tile `content-visibility: visible`
  - `default.css` and `dark.css` import `movies.css?v=3` and `drawer.css?v=3`

  Show them failing, then make the CSS changes. Verify they pass and run the whole suite

## 5. Browser check

- [x] 5.1 Before changing anything, record a baseline from the local app (read-only, signed out) at the same window size:
  - the movies page: `load` time and the size of the images loaded on the first screen
  - median and worst frame during three drawer opens and a row switch, partway down the list
- [x] 5.2 After the change, repeat 5.1 and also check:
  - a long jump from the top to the middle of the list doesn't freeze
  - the open poster, pointer and "New" ribbon aren't clipped
  - posters appear while scrolling
  - the unwatched list and the home page load lazily
  - the shows grid after adding episodes isn't affected
  - both themes

  Record the before and after numbers in design.md
- [x] 5.3 Run the whole suite and `openspec validate speed-up-movie-grid --strict`, and verify both pass

## Workflow follow-up

- Work on a feature branch, archive the change as the last commit of the PR, and open the PR with `gh`.
- After deploy, repeat the load and drawer measurements on mmdb.online and compare them with the 2026-10-24 numbers in proposal.md.
