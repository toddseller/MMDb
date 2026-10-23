# Proposal

## Why

The shows collection page (`GET /users/:user_id/shows`) gets slower with every show a user owns. Measured in production on 2026-10-23 for user 1 (859 shows, 29,727 episodes): the server takes 4.5 to 4.8 s before the first byte, against about 0.13 s for an empty collection (roughly 5 ms per show). From the code, one load makes roughly 2,600 SQL queries and preloads every episode and movie the user owns without using them. The browser is then asked for all 859 posters at once, about 157 MB (sampled: 541 Apple posters at about 103 KB, 264 `cdn.myflix.stream` posters at about 289 KB, 18 TheTVDB posters at about 1.4 MB).

## What Changes

- The shows grid loads each show's seasons in one batched query, so the number of SQL queries per load stays the same however many shows a user has.
- The page stops preloading episodes and movies it never renders, and checks "does this user have movies?" with an existence query instead of loading the whole collection.
- The season label under each poster ("Season 2", "Seasons 1, 3", "Seasons 1–4", "7 seasons") renders exactly as it does today.
- Show posters in the grid load only when they scroll near the viewport (native browser lazy loading).
- Grid posters from Apple TV artwork are requested at 400x400 instead of 600x600 (about 50 KB instead of 103 KB; 541 of user 1's posters). Other poster URLs are left alone: the other hosts in use offer no size in the URL, and none of the stored posters are TMDB `original` URLs. The stored `poster` value does not change, so the detail views and the iOS API keep the full-size image.
- The same fixes apply to the other two routes that render the show grid: adding episodes (`users_episodes.rb`) and adding a show (`shows_controller.rb`).
- Fix a missing opening quote in `POST /shows` (`find_by(show_collection_id = ?", ...)`), which made every request fail with a 500 since commit `a279c13`; without it the add-show grid could not be tested.

Out of scope (Phase 2 or later): pagination or infinite scroll, fixing the broken `/shows/filter` search, the stale `seasonCount`/`seasonNumbers`/`episodeCount` cache columns, database indexes, the movies page, recompressing or resizing `cdn.myflix.stream` and TheTVDB posters, and the render-blocking Optimizely script (122 KB gzipped, kept by decision for now).

## Capabilities

### New Capabilities
- `show-collection`: how a user's TV show collection grid is loaded and rendered (query budget, season labels, poster loading and sizing).

### Modified Capabilities
<!-- none: there are no existing specs -->

## Impact

- Code: `app/controllers/users_shows_controller.rb`, `app/controllers/users_episodes.rb`, `app/controllers/shows_controller.rb`, `app/views/shows/show.erb`, `app/views/partials/_my_shows.erb`, `_show_list.erb`, `_updated_show_list.erb`, `app/models/show.rb` (one poster-sizing method).
- Tests: the first request spec in the project; it needs a running Postgres test database (`MMDb_test`). No new gems: requests are driven with `Rack::MockRequest` from Rack.
- APIs: none. The JSON shape of the XHR response (`page`, `show_count`, `episode_count`) is unchanged; the iOS v2/v3 APIs are untouched.
- Data: no migrations, no writes.
