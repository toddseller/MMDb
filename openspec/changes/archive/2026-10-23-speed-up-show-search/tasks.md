# Tasks

## 1. Characterize today's behavior

- [x] 1.1 Add `spec/show_search_spec.rb` with WebMock stubs for the Apple search, show and episodes endpoints and the TMDB search and series endpoints (built in Ruby by a `ShowSearchStubs` module in the spec, so each example states its own shows), and characterization examples for the current result shape and merge priority (database over Apple over TMDB, one entry per "Title, Season N", sorted by year, title and season). Verify they pass against the current code before anything changes

## 2. Concurrency helper

- [x] 2.1 Write a spec for `Show.in_parallel`: it returns results in input order, never runs more than the limit at once, and keeps going when one item raises. Show it failing, then add the helper until it passes

## 3. Apple

- [x] 3.1 Add specs for partial matching (`the offi` keeps "The Office" and "The Office: Superfan Episodes", drops "Parks and Recreation"), the ranked cap of 10 (exact match listed last is still fetched), and one fetch per show across storefronts (US first, UK-only shows carry the UK store id). Show them failing, then rewrite `appletv_call` until they pass

## 4. TMDB

- [x] 4.1 Add specs for one request per show (20 results means 21 TMDB requests), a second request for a show with 25 seasons, and the same rows as the per-season responses gave. Show them failing, then rewrite `tmdb_call` with `append_to_response` and remove the `match_all` branch until they pass

## 5. Run sources together

- [x] 5.1 Add specs that the result is the same when TMDB answers before Apple, that a search needing 20 requests of 0.3s each finishes in under 2s, and that Apple failing leaves the database and TMDB entries. Show them failing, then run the database checks, Apple and TMDB through `in_parallel` in `get_series` until they pass
- [x] 5.2 Add a spec for the Plex webhook path: a new episode of a show Apple returns under its exact title is imported into the right season. Run the whole suite
- [x] 5.3 Change the characterization spec for same-named TMDB shows to expect both the UK (2001) and US (2005) *The Office*, and add one where two same-named shows share a year and collapse to the first. Show the first failing, then add the year to both merge conditions in `get_series` until they pass, and run the whole suite
- [x] 5.4 Add a spec where TMDB dates the UK *The Office* 2001 and Apple 2002, expecting each season once from Apple, and keep the 2001 and 2005 shows apart. Show it failing, then compare years within one in both merge conditions until it passes, and run the whole suite

## 6. Verify against the real services

- [x] 6.1 Time `lupin`, `the office` and `office` locally with the read-only probe used for the baseline, record the totals and request counts in design.md next to the baseline, and check the result lists still include the expected shows
- [x] 6.2 Run the whole suite and `openspec validate speed-up-show-search --strict`, and verify both pass

## Workflow follow-up

- Archive the change as the last commit of the change's PR, and open the PR with `gh`.
- After merge: `cd ~/MMDb && git pull --ff-only && docker compose restart web`, then run one search in Add TV Show and time the same three searches on the server.
