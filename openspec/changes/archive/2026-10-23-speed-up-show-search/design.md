# Design

## Context

`Show.get_series(term)` (`app/models/show.rb`) is used by `GET /shows` (the Add TV Show search), `Show.plex_add` (the Plex webhook) and the v2 and v3 search endpoints. It builds an array of season hashes in three steps, each waiting on the last:

1. Database shows whose `search_name` contains the term; for each season with an `appleTvId`, an Apple episodes request to refresh `count`.
2. `appletv_call`: a search in each of 4 storefronts; for each exact-title hit, a show request and an episodes request.
3. `tmdb_call`: one search; for every result, a series request plus one request per season.

Puma runs one thread in production (the dev compose file), and there are no tests for any of this today. Measurements are in proposal.md.

## Goals / Non-Goals

**Goals:**
- A search takes about as long as its slowest chain of dependent requests.
- Fewer requests: one per Apple show and one per TMDB show.
- The same result shape and merge rules for all callers.

**Non-Goals:**
- Caching, retries, or a new HTTP client.

## Decisions

### Threads from the standard library, a small helper, no ActiveRecord inside
A `Show.in_parallel(items, limit: 8) { |item| ... }` runs the block over the items with at most `limit` threads pulling from a `Queue`, and returns the results in input order. Net::HTTP releases Ruby's lock while waiting on the network, so threads overlap the waits.
*Alternative:* a gem such as `concurrent-ruby` or `typhoeus`. Rejected: about 15 lines of standard library cover it without a new dependency.

Only HTTP and plain hash-building run inside threads. The database query and every `season.attributes` read happen on the request thread first, so no thread checks out an ActiveRecord connection; the pool stays at its current size.

Each item's block rescues its own errors and logs the class and message, as the current code does, so one failed request drops only its own entries. A source whose search request fails contributes nothing.

### Shape of `get_series`
```ruby
db_rows, apple_rows, tmdb_rows = in_parallel([:db, :apple, :tmdb], limit: 3) { |source| ... }
```
- `:db`: the rows built from database seasons; their Apple count checks run through `in_parallel`.
- `:apple`: `appletv_call(term)`.
- `:tmdb`: `tmdb_call(term)`.

Then the merge runs unchanged on the request thread: start from `db_rows`, add each Apple row under today's condition, add each TMDB row under today's condition, and sort. Both conditions also compare the year through `same_year?`, which treats years at most one apart as the same, so a row is a duplicate only when an earlier row has the same collection name and a year within one of it. The tolerance exists because Apple and TMDB often disagree by a year: the UK *The Office* is 2001 on TMDB and 2002 on Apple, and an exact comparison listed its seasons twice. Because the merge only starts once all three finish, priority doesn't depend on which source answers first.

### Apple
1. Search the 4 storefronts in parallel.
2. Collect `Show` items whose title contains the term (ignoring case), unique by Apple id. For each id, keep the first storefront in the order US, UK, CA, AU that returned it.
3. Rank: exact title first, then starts with the term, then contains it, preserving Apple's order within each rank (a stable `sort_by` on `[rank, original index]`). Take the first 10.
4. For each show, fetch the show request and the episodes request in parallel, then build the season rows as today, with `storeId` set to that show's storefront.

### TMDB
1. One search request, as today.
2. For each result in parallel: `GET /tv/{id}?append_to_response=content_ratings,season/1,...,season/19`. TMDB leaves out seasons that don't exist (checked: *Lupin* returns only `season/1` to `season/3`), so no count is needed up front. If the show's `seasons` list has numbers above 19, a second request appends those, up to 20 per request.
3. Build rows from `body["season/N"]` exactly as from today's per-season responses (collection name, `tmdb` collection id, poster, overview falling back to the show's, year, genre, rating).

The `match_all = false` branch has no callers and goes.

### Concurrency limits
- 8 threads per fan-out.
- In the worst case that's 3 sources, each fanning out once at a time, so about 16 requests in flight.
- TMDB allows about 50 requests a second. Apple's unofficial API has no published limit, so this keeps Apple to at most 8 at once.

## Risks / Trade-offs

- [Apple starts rate-limiting several requests at once] → The limit of 8 is one constant. A failed show is logged and skipped rather than failing the search.
- [Thread errors surface as missing results instead of exceptions] → Each failure is logged with its class. A spec checks that one source failing leaves the others in the result.
- [Partial Apple matching adds entries the webhook doesn't expect] → `plex_add` already filters on exact title and season, and a spec covers the webhook path.
- [Apple and TMDB disagree on a show's first year by two or more] → Its seasons appear twice, once per source. Accepted: seeing both beats losing one of two real shows with the same name.
- [A remake within a year of the original] → The two collapse into one, the earlier source winning. Rare enough to accept.
- [Tests depend on timing] → The concurrency spec uses WebMock responses delayed by a stubbed sleep of 0.3s, and a 2s bound where running sequentially would take 6s or more, so jitter can't make it flaky.

## Migration Plan

Deploy with `git pull --ff-only && docker compose restart web` (no gems, settings or schema). Afterwards, time `lupin`, `the office` and `office` on the server with the same probe used for the baseline. Roll back by reverting the merge.

## Results

Measured on 2026-10-23 from the same machine and probe as the baseline (two runs each). Request counts are the actual requests made. The probe first reported Apple's twice: it counted calls to `Net::HTTP#request`, which calls itself again after opening a connection, as it does for HTTParty's requests. Apple's numbers were halved to correct that; Apple's endpoints answer directly, with no redirects.

| Search | Before | After | Requests before / after | Seasons listed before / after |
|---|---|---|---|---|
| `lupin` | 10.4s | 1.1s, 0.9s | 65 / 46 | 31 / 42 |
| `the office` | 25.2s | 0.9s, 0.8s | 101 / 56 | 34 / 47 |
| `office` | 16.8s | 1.0s, 0.9s | 114 / 57 | 69 / 83 |

The extra seasons are partial Apple matches, for example the *Lupin the Third* series for `lupin` and *The Office: Superfan Episodes* for `the office`. The "contains" rule also brings in titles such as "Inside Out: Ticking With the Crow/The Officers' Mess" for `the office`.
