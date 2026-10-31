# Proposal

## Why

The episode list offered when adding episodes to a season includes episodes that haven't aired yet, so they can be added to a collection before they exist. The app once left them out: the iTunes and TVDB lookups skipped future episodes, but the check was lost when the Apple TV lookup replaced iTunes (2019, `bae83ac`) and went away with the TVDB lookup (2026, `98f1c27`). The TMDB lookup never had it.

## What Changes

- The episode list for a stored season, used by the web episode picker and by the `/add_episodes` endpoints of API v2 and v3, lists only episodes whose air date is today or earlier. Episodes with no air date are left out. This applies to Apple and TMDB seasons alike.
- The rule is the one the Plex webhook already uses for a show-level import, so both paths agree on what "aired" means.
- The Plex webhook is unchanged: a show-level import keeps its own air-date filter, and a single-episode import keeps ignoring the air date.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `episode-lookup`: adds a requirement that the episode list for adding episodes shows only aired episodes.

## Impact

- Code: `Show.get_episodes` in `app/models/show.rb`, reusing `Show.aired?`.
- Callers that change behavior without edits: `POST /users/:id/shows` (the web episode picker), and `GET /api/v2/add_episodes` and `/api/v3/add_episodes` (myflix). The picker's episode count, which only chooses the layout, counts the shorter list.
- Not affected: the Plex webhook, which calls the Apple and TMDB fetchers directly.
- Tests: `spec/episode_lookup_spec.rb`. Specs that stub `Show.get_episodes` are unaffected.
