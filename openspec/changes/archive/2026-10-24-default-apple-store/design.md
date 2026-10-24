# Design

## Context

`Show.get_episodes(id, season, skip, count, storeId = '143441')` has a US default, but every caller passes `season.storeId` explicitly, so a nil store overrides it. `Show.plex_add` skips `get_episodes` and calls `appletv_episodes` with `season.storeId` directly. `appletv_episodes` builds its URL with `'&sf=' + storeId`, and a nil raises `TypeError`. Its `rescue => e` catches that, prints it and returns `[]`.

## Goals / Non-Goals

**Goals:**
- Every Apple episode lookup works for seasons with no stored storefront.

**Non-Goals:**
- Backfilling `storeId` on the 252 rows.
- Changing how the storefront is chosen for new seasons.

## Decisions

**Default inside `appletv_episodes`, the one function all four paths reach.** Use `storeId.presence || APPLE_STORES.first`. `APPLE_STORES.first` is `'143441'`, the US store the search tries first. Defaulting in each of the three controllers and in `plex_add` was the alternative, but it would repeat the same fix four times and miss the next caller. `presence` also covers a blank string as well as nil.

**No data backfill.** With the code defaulting, the stored nils are harmless. A backfill would add a production data step for no change in behavior.

## Risks / Trade-offs

- [A season with no store whose show is only on another storefront] → Unlikely: these seasons date from when every lookup was US, and all 15 sampled seasons returned their full count from the US store. Such a season would still return no episodes, as it does today.
