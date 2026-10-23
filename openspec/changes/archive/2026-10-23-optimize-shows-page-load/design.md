# Design

## Context

See proposal.md for why. The grid is rendered by three partials that share the same tile markup: `_my_shows.erb` (collection page, one call per show), `_show_list.erb` (after adding episodes) and `_updated_show_list.erb` (after adding a show). Each builds its season label from `show.seasons.count` (always SQL), `show.season_numbers`, `show.seasons.length` and `show.seasons[0]` (these three use the loaded association). The callers pass `@user.shows.sorted_list`, a lazy relation with no preloading. `Show has_many :seasons, -> { order(season: :asc) }`.

The project has no tests yet. `spec/spec_helper.rb` loads `config/environment.rb`, but session and view settings live in `config.ru`. The `rake db:migrate` task calls `ActiveRecord::Migrator.migrate`, which no longer exists in ActiveRecord 7.2. Postgres is not running locally right now.

## Goals / Non-Goals

**Goals:**
- A constant query count for the grid (see specs/show-collection).
- Byte-for-byte identical tile text, so no client JS changes are needed.
- The smallest diff: no new gems, no migrations, no new layers.

**Non-Goals:**
- Making the cached `seasonCount`/`seasonNumbers` columns trustworthy and using them (Phase 2 candidate).
- Changing `Episode.episode_count` (one aggregate query; fine at 30k rows with the existing `season_id` index).
- Fixing the other bugs noticed along the way (listed under Risks).

## Decisions

**1. Preload seasons on the relation the callers already build.** `@user.shows.sorted_list.includes(:seasons)` in all three controllers. ActiveRecord runs one extra query (`seasons WHERE show_id IN (...)`) and keeps the association's `order(season: :asc)`, so `season_numbers` and `seasons[0]` see the same order as before. *Alternative:* a `with_seasons` scope on `Show`. Rejected: three call sites don't justify a new name.

**2. `.count` → `.size` in the partials.** `size` uses the loaded collection and falls back to SQL when it isn't loaded, so a caller that forgets the preload still gets correct output, just slower. *Alternative:* read the cached `seasonCount` column. Rejected for now: it is written before new seasons are saved, so it is stale (see proposal, out of scope).

**3. Drop the unused preload in `users_shows_controller`.** `User.includes(shows: { seasons: :episodes }, movies: [])` becomes `User.find`. Nothing reads it: `sorted_list` starts a new query. In `shows/show.erb`, `@movies.length != 0` becomes `@movies.exists?` (`SELECT 1 ... LIMIT 1`).

**4. Poster sizing as one `Show` instance method, used only by the grid partials.** Roughly `poster.to_s.sub(/600x600\.jpg\z/, '400x400.jpg')`. 400px is 2× the 200px tile for high-density screens; measured in production, it halves the bytes (about 103 KB to 50 KB). A TMDB `original` → `w500` rule was considered and dropped: none of user 1's 859 posters match it. `cdn.myflix.stream` (Cloudflare in front of CloudFront/S3) has no URL-based resizing (`/cdn-cgi/image/` returns 404), and TheTVDB URLs carry no size, so both stay full size. *Alternatives:* a `before_save` that rewrites the stored URL (rejected: changes data the detail view and the APIs rely on, and needs a backfill); a Sinatra helper in `app/helpers` (works too, but a model method can be unit-tested without booting the app).

**5. Native `loading="lazy"` rather than the jQuery plugin.** It survives the XHR HTML swaps that the page relies on, with no rebinding. Added to `_my_shows.erb` and `_updated_show_list.erb`. `_show_list.erb` already defers via `class="lazy"` + `data-original` and has no `src`, so it only gets the thumbnail URL.

**6. Tests drive the real Rack app; queries are counted with notifications.**
- Load the app with `Rack::Builder.parse_file('config.ru')`, so session and view settings match production, and call it with `Rack::MockRequest` plus `HTTP_X_REQUESTED_WITH: XMLHttpRequest`. No `rack-test` gem.
- Count queries by subscribing to `sql.active_record`, ignoring `SCHEMA` and `TRANSACTION` events.
- "Size independent" is tested by comparing the counts for 2 and 10 shows, not by pinning an exact number, so the test doesn't break on unrelated query changes.
- Logged-in routes (adding episodes) log in through `POST /sessions` and carry the session cookie.
- Each example runs in a transaction that rolls back.
- `spec_helper` brings the test database up to date with `ActiveRecord::MigrationContext.new('db/migrate').migrate` rather than the broken rake task.

## Risks / Trade-offs

- [Preload memory for 859 shows] → roughly 2,000 to 3,000 small season rows. This replaces a preload of 30,000 episodes and every movie, so it is much less than today.
- [Old migrations fail on ActiveRecord 7.2 when building a fresh test DB] → if one does, fall back to loading a `pg_dump --schema-only` of the dev database into `MMDb_test` and record the step in tasks.md.
- [Most of the remaining image weight is not addressed by sizing: `cdn.myflix.stream` posters average about 289 KB (76 MB for 264 posters) and TheTVDB posters about 1.4 MB (25 MB for 18)] → lazy loading limits the first view to the visible posters; recompression is a Phase 2 item.
- [Apple URLs in other shapes (e.g. `600x600bb.jpg`, older iTunes art)] → they don't match the anchored pattern and stay full size. That is correct, just not optimized.
- [Out-of-scope bugs seen while reading] → `users_episodes.rb` reports `Episode.all.count` (episodes of all users) as the user's episode count; a show with zero seasons raises in the label (`seasons[0].season` on nil); `/shows/filter` does not exist. Each is left as is and noted for Phase 2.

## Migration Plan

No data or schema changes. Deploy as usual; roll back by reverting the commit.
