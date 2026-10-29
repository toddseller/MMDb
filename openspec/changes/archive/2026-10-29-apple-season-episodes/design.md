# Design

## Context

`Show.appletv_show` builds a new season's window from `view/show/<id>/episodes` without paging: `seasonSummaries[i].episodeCount` gives each season's size, `seasons[i].seasonNumber` its number, and the start is the running sum of earlier counts. That window is stored on the season (`skip`, `count`). Afterwards:

- `refresh_apple_count` (run on every stored season during a show search) re-reads the summaries and refreshes `count` only, indexing `seasonSummaries[season - 1]`.
- `get_episodes(id, season, skip, count, storeId)` → `appletv_episodes(id, skip, count, storeId)` fetches `episodes?skip=&count=` with the stored `skip`; callers are the season picker and `/api/v2`, `/api/v3` `add_episodes`.
- `plex_add` calls `appletv_episodes` itself: the whole window for a show, or `skip + episode - 1` with count 1 for one episode.

Each episode Apple returns carries `seasonNumber`. Checked against Apple for South Park: summaries sum to the 333 listed episodes, and the summed start of season 29 is 329, the right place, while the stored start is 328.

## Goals / Non-Goals

**Goals:**
- Every Apple lookup uses Apple's current window and lists only the requested season.

**Non-Goals:**
- Writing corrected `skip` values back to the database: the stored value becomes a fallback only, so rewriting it adds writes for no behavior.
- TMDB seasons, which are fetched by season number already.

## Decisions

- **One helper, `Show.apple_season_window(id, season_number, store_id)`**, returns `[skip, count]` or `nil`: one request to `tv.apple.com/api/uts/v2/view/show/<id>/episodes?sf=…` (the URL `refresh_apple_count` uses), find the index of `seasons` whose `seasonNumber` equals the season, sum the earlier `seasonSummaries` counts. `nil` when the request fails or the season isn't listed.
- **Use it where the window is consumed**: `get_episodes` (Apple branch) and `plex_add` take `window || [stored skip, stored count]`. `refresh_apple_count` takes the count from it, which also stops indexing summaries by `season - 1`, wrong for shows whose Apple seasons don't start at 1 or skip numbers.
- **Filter by season number in `appletv_episodes`**: an optional `season_number` argument; episodes whose `seasonNumber` differs are dropped (an episode without one is kept, as now). The season number stays out of the returned hash, because `plex_add` assigns the hash straight onto an `Episode`.
- **Callers keep their signatures**; the API controllers and the picker change nothing.

## Risks / Trade-offs

- [One extra Apple request per lookup] → The same request a search already makes for every stored season; adding episodes is occasional.
- [Apple's summaries and episode list disagree] → The season-number filter keeps the result to the right season even then; at worst an episode is missing rather than another season's shown.
- [Apple numbers a compilation inside a season (South Park S11E101)] → It is listed when that season is picked, as Apple lists it; the owner can skip it.

## Migration Plan

Deploy (restart only). Then pick South Park season 28 and 29 in the UI: they should list five and four episodes, and the owner adds S28E4 "Turkey Trot" and S29E4. Rollback is reverting the commit; stored data is untouched.
