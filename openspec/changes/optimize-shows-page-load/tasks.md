# Tasks

Test-first throughout: write the test, run it and see it fail for the right reason, then write the smallest code that passes, then run the whole suite.

## 1. Test database and harness

- [x] 1.1 Start local Postgres (`brew services start postgresql@<version>` or equivalent) and create `MMDb_test` (`createdb MMDb_test`); verify `pg_isready` reports accepting connections
- [x] 1.2 In `spec/spec_helper.rb`, migrate the test DB with `ActiveRecord::MigrationContext.new(APP_ROOT.join('db', 'migrate')).migrate`, wrap each example in a rolled-back transaction, and add a small query counter subscribed to `sql.active_record` that ignores `SCHEMA`/`TRANSACTION`; verify `bundle exec rspec` runs with 0 examples and no errors (if an old migration fails on AR 7.2, load a `pg_dump --schema-only` of the dev DB instead and note it here)
  - Note (2026-10-23): the migrations run on AR 7.2 but don't build the real schema; `shows."episodeCount"` (written by `Show#add_season_count`) exists only in production, added by hand. There is no dev copy, so `db/structure.sql` is `pg_dump --schema-only --no-owner --no-privileges` of the production DB (192.168.40.4, Postgres 11), with the `\restrict` token lines removed. `spec_helper` loads it with `psql` into an empty `MMDb_test` instead of migrating, and always forces `DATABASE_URL` to the local test DB because `.env` points at production. Other differences from the migrated schema: id columns are `integer` there, not `bigint`
- [x] 1.3 Add a shared request helper that loads the app with `Rack::Builder.parse_file('config.ru')`, sends XHR requests via `Rack::MockRequest`, and logs in through `POST /sessions` keeping the cookie; verify with a smoke example that `GET /` returns 200

## 2. Poster thumbnails (spec: Grid posters use thumbnail-sized images)

- [x] 2.1 Write `spec/show_spec.rb` examples for the thumbnail method: Apple `600x600.jpg` → `400x400.jpg`; a `cdn.myflix.stream` URL, a TheTVDB URL and the default S3 artwork unchanged; nil poster returns empty string, and `poster` itself unchanged; run and see them fail with NoMethodError
- [x] 2.2 Add the one-line thumbnail method to `Show` (design decision 4); verify the 2.1 examples pass

## 3. Collection page queries (specs: load cost independent of size; no unused data; season label unchanged)

- [x] 3.1 Write `spec/shows_page_spec.rb` for XHR `GET /users/:id/shows`: query count is equal for a user with 2 shows and one with 10 (several seasons each); no query matches `SELECT "episodes".*`; no query selects movie rows; the season labels for shows with seasons {2}, {1,3}, {1,2,3} and 7 seasons read "Season 2", "Seasons 1, 3", "Seasons 1–3", "7 seasons"; a visitor sees the Movies link when the owner has a movie. Run and see the count and episodes examples fail while the label examples pass (a characterization of today's output)
- [x] 3.2 In `users_shows_controller.rb`, replace the `User.includes(...)` preload with `User.find` and build `@my_shows` with `.includes(:seasons)`; in `_my_shows.erb` change `show.seasons.count` to `show.seasons.size`; in `shows/show.erb` change `@movies.length != 0` to `@movies.exists?`; verify all 3.1 examples pass

## 4. Lazy, thumbnail posters on the grid (spec: Grid posters load lazily)

- [x] 4.1 Extend `spec/shows_page_spec.rb`: every grid `<img>` has `loading="lazy"` and its `src` is the thumbnail URL for an Apple-art show; run and see it fail
- [x] 4.2 In `_my_shows.erb` add `loading="lazy"` and use the thumbnail method for `src`; verify 4.1 passes

## 5. The other two grid renderers

- [x] 5.1 Write a spec for `POST /users/:user_id/shows/:show_id/seasons/:season_id/episodes` (logged in, same single episode): equal query counts for owners of 2 and 10 shows, and grid images use thumbnail URLs; run and see it fail
- [x] 5.2 In `users_episodes.rb` add `.includes(:seasons)` to `@my_shows`; in `_show_list.erb` change `.count` to `.size` and use the thumbnail URL in `data-original`; verify 5.1 passes
- [x] 5.3 Write a spec rendering `_updated_show_list.erb` through `POST /shows` with `new` set (logged in, existing show and season so no external API calls): equal query counts for 2 and 10 shows, `loading="lazy"` and thumbnail `src`/`data-original`; run and see it fail
- [x] 5.4 In `shows_controller.rb` add `.includes(:seasons)` to `@my_shows`; in `_updated_show_list.erb` change `.count` to `.size`, add `loading="lazy"`, use the thumbnail URL; verify 5.3 passes

## 6. Integration check

- [x] 6.1 Run the whole suite (`bundle exec rspec`) and verify it is green
- [x] 6.2 After deploying, time `https://mmdb.online/users/1/shows` (full and XHR, 3 runs each, `curl -w "%{time_starttransfer}"`) and record the result next to the baseline below; verify the wait for the first byte is close to the empty-collection figure rather than about 4.6 s
- [x] 6.3 Check in a browser that the grid looks the same, posters load as you scroll, and the network panel shows 400x400 Apple images; record the image bytes of the first screen

Baseline, production, 2026-10-23, user 1 (859 shows, 29,727 episodes):
- Wait for first byte: 4.45 to 4.78 s (XHR and full page alike); empty collection 0.11 to 0.18 s; homepage 0.49 s
- Response: 385 KB of HTML (47 KB gzipped)
- Posters requested at once: 859, about 157 MB (541 Apple at about 103 KB, 264 `cdn.myflix.stream` at about 289 KB, 18 TheTVDB at about 1.4 MB, 36 other)
- Scripts (gzipped): Optimizely 122 KB, jQuery 33 KB, bootstrap 10 KB, mmdb.js 6 KB, jquery-lazyload 2 KB
- Browser (Brave, logged in, 2026-10-23): wait for first byte 4,461 ms; 862 `img` elements, 0 with `loading="lazy"`; 551 Apple posters at 600x600, 0 at 400x400; all 862 loaded with no scrolling, against about 45 visible on the first screen; posters display at 213 px from 600 px files; at least 19.4 MB decoded (the Resource Timing buffer kept only 234 of the image entries, so the real total is higher). Poster hosts send no `Timing-Allow-Origin`, so transfer bytes read 0 from script; take the 6.3 byte figures from the DevTools network panel in a fresh tab with the cache disabled

After, production, 2026-10-23, `cf58b24` deployed (`git merge --ff-only` on the server, then `docker compose restart web`):
- Wait for first byte (curl, logged out): full page 0.66 s (first, cold), 0.27 s, 0.29 s; XHR 0.34 s, 0.31 s, 0.29 s; homepage 0.58 s. About 15 times faster than the 4.6 s baseline; still about twice the empty-collection figure, which is the remaining per-show rendering and the one batched seasons query
- Response: 389 KB of HTML (full page), 404 KB (XHR JSON); slightly larger than before because of the added `loading` attribute
- Browser (Brave, logged in, fresh tab): wait for first byte 247 ms; 859 grid images, all with `loading="lazy"`; 541 Apple posters at 400x400, 0 at 600x600 (400 px files displayed at 213 px); 65 posters loaded before scrolling (42 fully visible), 165 after scrolling half-way; first screen 72 image requests, 1.93 MB decoded, against all 862 and at least 19.4 MB before. Transfer bytes still unreadable from script (no `Timing-Allow-Origin`)
- Grid looks the same as before; season labels unchanged; no broken images

## Workflow follow-up

- Archive the change after review with `/opsx:archive`.
- Phase 2 candidates noted during design: pagination or infinite scroll, a working `/shows/filter`, trustworthy cached season counts, `Episode.all.count` in `users_episodes.rb`, zero-season shows crashing the label, recompressing `cdn.myflix.stream` posters (or enabling Cloudflare image resizing), smaller TheTVDB posters, and the render-blocking Optimizely script (kept for now by decision).
