# Tasks

## 1. Default the Apple storefront for episode lookups

- [x] 1.1 Add `spec/episode_lookup_spec.rb` with a WebMock stub for Apple's `tv.apple.com/.../episodes` endpoint, and examples for the spec's three scenarios: a season with no store fetched through `Show.get_episodes` with `season.storeId` as the controllers call it, the Plex webhook importing an episode of such a season, and a UK season using `143444`. Run them and show the two no-store examples failing with no episodes
- [x] 1.2 Make `Show.appletv_episodes` use `APPLE_STORES.first` when `storeId` is blank. Verify the new examples pass, then run the whole suite and `openspec validate default-apple-store --strict`, and verify both pass

## Workflow follow-up

- Work on a feature branch, archive the change as the last commit of the PR, and open the PR with `gh`.
- After deploy, fetch Rick and Morty S1's episodes on production (season 812, no store) and check that all 11 come back.
