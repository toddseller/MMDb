# Proposal

## Why

When an episode is added by hand or through the API and the season already has that episode number, the stored episode is kept as it is and the incoming details are thrown away. An episode saved without a plot or runtime therefore stays blank forever, even when a later add brings those values.

## What Changes

- Adding an episode the season already has fills in the stored episode's blank fields (title, air date, plot, runtime, still) from the incoming values. Fields that already hold a value, including hand edits, are left alone.
- This covers every non-Plex add: the search panel (one episode or Add All Episodes), Create New Show's episode tab, and `POST /add_episodes` in API v2 and v3.
- The seven copies of "find the episode or build a new one, save it, append it to the season" are replaced by one helper on `Season`.
- The Plex import is unchanged: it keeps replacing a stored episode's values, as the `plex-webhook` spec requires.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `adding-to-collection`: adds a requirement that re-adding a stored episode fills its blank fields and keeps the rest.

## Impact

- `app/models/season.rb`: new episode-adding helper.
- `app/controllers/users_episodes.rb`, `app/controllers/shows_controller.rb`, `app/controllers/api_v2_controller.rb`, `app/controllers/api_v3_controller.rb`: call the helper instead of `find_by || new`.
- No schema, API shape or client changes. Responses stay the same apart from the filled-in values.
