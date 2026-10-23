# Proposal

## Why

Searching in Add TV Show takes 10 to 25 seconds: `lupin` 10.4s (65 outside requests), `the office` 25.2s (101), `office` 16.8s (114), measured on 2026-10-23. `Show.get_series` makes every request one after another: an Apple episode-count check per matching database season, 4 Apple storefront searches with details fetched again in each, then TMDB details for every search result, one request per season. Partial titles also never return Apple results, because Apple matches are kept only when the title equals the search term, so the list falls back to TMDB even when Apple has the show.

## What Changes

- The database-season checks, the Apple lookup and the TMDB lookup run at the same time, and each fans out its own requests a few at a time. Results are still merged in the fixed order database, then Apple, then TMDB, so Apple keeps priority whichever source answers first.
- Two entries count as the same season only when they share the "Title, Season N" collection name and their years are at most one apart (Apple and TMDB often date the same show a year apart, such as the UK *The Office*: 2001 on TMDB, 2002 on Apple). Today the name alone decides, so the US and UK *The Office* collapse into whichever TMDB lists first; both will now appear.
- Apple keeps shows whose title contains the search term, ignoring case, instead of exact matches only. At most 10 shows are fetched, ranked exact title first, then titles starting with the term, then titles containing it.
- The 4 Apple storefronts are searched together, and each unique show is fetched once, from the first storefront in the order US, UK, CA, AU that has it.
- TMDB keeps every first-page result as today (no cap, no title filter), but fetches each show with its seasons and ratings in one request (`append_to_response`), with a second request only for shows with more than 19 seasons.
- The results keep their shape (one entry per season with the same fields), so the search page, the Plex webhook (`plex_add`) and the v2/v3 search endpoints work unchanged.

Out of scope: a show-first, two-step picker; caching results.

## Capabilities

### New Capabilities
- `show-search`: how a title search builds its list of seasons to add from the database, Apple TV and TMDB: which matches each source contributes, their priority, how many outside requests a search may make, and how they are scheduled.

### Modified Capabilities

None.

## Impact

- `app/models/show.rb`: `get_series`, `appletv_call` and `tmdb_call` (the unused `match_all = false` branch goes).
- `spec/`: a new `show_search_spec.rb` with WebMock stubs for Apple and TMDB.
- No new dependencies (Ruby threads from the standard library), no settings, no schema changes.
- Outside services: fewer requests per search to both APIs, but several at once instead of one at a time.
