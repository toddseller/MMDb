# Design

## Context

`Show.get_series` runs three sources in parallel. The database source maps `refresh_apple_count` over every stored season of every matching show (`InParallel`, eight at a time). `refresh_apple_count` calls `apple_season_window(appleTvId, season, store)`, which fetches `tv.apple.com/api/uts/v2/view/show/<id>/episodes?sf=…` and works out one season's start and count from `seasons` and `seasonSummaries`. All of a show's seasons share that response. Measured on the server for "south park" (29 stored Apple seasons): refresh 1.98 s and 2.17 s, Apple search 0.3 s, Apple show details 0.5 s, TMDB 0.3 s, whole search 1.9 s and 2.0 s.

The app's Apple requests are four `HTTParty.get` calls: `AppleTv.search`, `AppleTv.view`, `apple_season_window` and `appletv_episodes`. None passes a timeout, so Net::HTTP's defaults apply (60 s to open, 60 s to read). Failures already fall back: `apple_season_window` rescues to `nil` and logs, `appletv_episodes` rescues to `[]`, and `InParallel` turns an exception in one item into `nil` and logs it.

## Goals / Non-Goals

**Goals:**
- One season-list request per stored show and storefront in a search.
- No single Apple request can delay a search or lookup by more than about 5 seconds.

**Non-Goals:**
- TMDB timeouts (consistently ~0.3 s).
- Caching Apple responses between searches.

## Decisions

- **Split `apple_season_window` into fetch and compute.** `apple_seasons(id, store)` fetches the season list (or `nil`, logged on error); `season_window(data, season_number)` works out `[skip, count]` from it. `apple_season_window` becomes the two together, so episode lookups and Plex imports are unchanged.
- **Group in `get_series`'s database source.** Group the stored seasons with an Apple id by `[appleTvId, store]`, fetch each group's list with `InParallel`, then refresh each season from its group's list. Seasons without an Apple id pass through as now. `refresh_apple_count` takes the fetched list instead of fetching, and stays the one place a stored row is refreshed.
- **One constant, `AppleTv::TIMEOUT = 5`,** passed as `timeout:` to the four Apple calls. HTTParty applies it to opening, reading and writing. Five seconds is ten times the slowest normal answer measured (0.56 s).
- **Errors keep their current paths.** A timeout raises `Net::OpenTimeout` or `Net::ReadTimeout`, both `StandardError`s, which the existing rescues and `InParallel` already handle; no new fallback code.

## Risks / Trade-offs

- [Apple is slow but healthy for a while (over 5 s)] → Searches show stored counts, and adding episodes uses stored windows, logged, until Apple speeds up; nothing is written from a timed-out answer.
- [Grouping by store as well as show] → A show stored under two storefronts makes two requests, which is correct, since the storefronts can differ.

## Migration Plan

Deploy (restart only), then time the South Park search on the server as in the Context measurements; expected around 0.5 s.
