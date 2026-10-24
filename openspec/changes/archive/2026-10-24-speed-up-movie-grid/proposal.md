# Proposal

## Why

The movies page is slow to finish loading, and its details drawer stutters. Both were measured on mmdb.online on 2026-10-24 for user 1 (4,526 movies).

Loading:
- The HTML arrives in 0.4s, but the tab keeps loading until 2.2s on a fast connection.
- The 42 posters on the first screen total 37MB. 1,948 of the user's movie posters are Apple artwork stored at 2000×3000 (about 2MB each) and shown at 174×261. Apple serves the same poster at 348×522 for 73KB.
- The unwatched, 4K and search lists put a real `src` on every poster, so the unwatched list asks for all 2,582 of its posters at once.

The drawer:
- Each animation frame takes 100 to 200ms on movies, against 17ms on shows (858 tiles).
- Script and layout are cheap. The time goes to painting and compositing, driven by three things:
  - a theme rule that puts every image on its own GPU layer (4,526 layers)
  - the jQuery lazyload plugin, which reads every poster's position on each scroll
  - rendering all 4,526 tiles every frame
- Letting the browser skip off-screen tiles (`content-visibility`) brought frames down to about 17ms. With the plugin still running, though, one long scroll froze the page for 30 seconds, so the plugin has to go first.

## What Changes

- Movie grids request Apple posters at 348×522 instead of their stored size. Other hosts are left alone; TMDB posters are already `w342`. The stored poster, the drawer and the APIs keep the full size.
- Every movie and show grid loads posters with the browser's native lazy loading. This covers your movies page, the unwatched, 4K and search lists, the home page's top and recent movies, and the shows grid after adding episodes. The jQuery lazyload plugin and its placeholder are removed.
- The theme rule that gives every image its own GPU layer is removed.
- The browser skips off-screen movie tiles, so opening, switching and closing the drawer stays smooth with thousands of movies.

## Capabilities

### New Capabilities

- `movie-collection`: how a user's movie grid loads its posters (size and deferred loading).

### Modified Capabilities

- `show-collection`: "Grid posters load lazily" no longer allows the script-based lazy loader. Every show grid uses native lazy loading.
- `detail-drawer`: adds that the drawer stays smooth in a collection of thousands of movies.

## Impact

- Views: `_my_movies`, `_movie_list`, `_filtered_list`, `_top_movies`, `_show_list`, `_updated_show_list`, and `layout.erb` (drops the plugin script).
- `app/models/movie.rb` gets `thumbnail`, alongside `Show#thumbnail`.
- `public/js/mmdb.js` and `application.js` lose their `.lazyload()` calls, and `public/js/jquery-lazyload.js` is deleted.
- CSS: both theme `movies.css` files lose the `img` layer rule, and `drawer.css` adds `content-visibility` to movie tiles. The import versions are raised under `page-assets`.
- Specs: new and updated request specs for each grid. `page_assets_spec.rb` expects one fewer script.
- No server, data or API changes.
