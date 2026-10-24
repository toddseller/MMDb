# Proposal

## Why

252 Apple seasons on production have no stored Apple storefront: all of them were added in 2019, before the app stored one. Every episode lookup for them passes that empty store to Apple and fails with an error that gets swallowed. So the add-episodes screen, the v2 and v3 episode endpoints and the Plex webhook all get no episodes for those seasons. A sample of 15 of them all returned their full episode count from the US store.

## What Changes

- An Apple episode lookup with no store uses the US storefront (`143441`), which is the default `get_episodes` and the search's Apple count refresh already use.
- No data changes. Stored seasons keep their empty store.

## Capabilities

### New Capabilities

- `episode-lookup`: how a stored season's episodes are fetched from its source.

### Modified Capabilities

None.

## Impact

- `Show.appletv_episodes` in `app/models/show.rb`. It is shared by `users_shows_controller.rb`, `api_v2_controller.rb`, `api_v3_controller.rb` (through `Show.get_episodes`) and `Show.plex_add`, none of which change.
- A new `spec/episode_lookup_spec.rb`.
