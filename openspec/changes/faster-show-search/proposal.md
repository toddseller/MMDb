# Proposal

## Why

A show search refreshes the episode count of every stored season that matches, with one Apple request per season. Every season of a show comes from the same response, so a long-running show repeats the same request: South Park makes 29, eight at a time, and the refresh takes about 2 seconds of a 2-second search, measured on the server. One search after a restart took 27 seconds. None of the app's Apple requests has a timeout, so one slow or stalled Apple answer holds the search until Apple replies, up to Ruby's 60-second default.

## What Changes

- The search's refresh fetches each stored show's Apple season list once and works out every stored season's count from it.
- Every Apple request gives up after 5 seconds. A slow answer is treated like a failed one: the refresh keeps the stored count, an episode lookup uses the stored window, and a search without Apple's results still returns the stored and TMDB seasons.
- TMDB requests are unchanged; they answered in about 0.3 seconds in every measurement.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `show-search`: adds that stored seasons are refreshed with one Apple request per show, and that a slow Apple answer can't hold a search up for more than a few seconds.

## Impact

- `app/models/show.rb` (`get_series`, `refresh_apple_count`, `apple_season_window`, `appletv_episodes`) and `app/models/apple_tv.rb` (`search`, `view`).
- No change to what a search returns or to episode lookups' results.
- Tests in `spec/show_search_spec.rb` and `spec/episode_lookup_spec.rb`.
