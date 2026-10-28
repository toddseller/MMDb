# Proposal

## Why

When Plex adds several episodes at once it sends a single show-level `library.new` event. The webhook then fetches the show's latest season from TMDB or Apple and saves every episode in it, including ones that haven't aired. Those episodes come in as placeholders ("Episode 6", no plot, no still). An import also never fixes a placeholder: it finds the stored episode by number and saves it unchanged, so the real details are thrown away even when Plex later reports the actual episode.

## What Changes

- A show-level Plex import saves only episodes whose air date is today or earlier. An episode with no air date is skipped.
- A single-episode Plex import works as before: Plex has the file, so the episode is imported whatever its date.
- Whenever a Plex import (show-level or single-episode) finds an episode already stored, it overwrites that episode's title, date, plot, runtime and still with the newly fetched values. This also overwrites any hand edits to that episode.
- Adding episodes by hand and through the APIs is unchanged and still lists upcoming episodes.

Out of scope: a one-time cleanup of placeholders already stored. Each one is fixed the next time Plex reports it or sends a show-level event for its season.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plex-webhook`: adds requirements that a show-level import adds only aired episodes and that an import refreshes an episode already stored.

## Impact

- `app/models/show.rb`: `Show.plex_add` filters the fetched season by date for show-level events and assigns fetched attributes to existing episodes before saving.
- `app/models/episode.rb`: a refreshed episode's runtime is formatted the same way as a new episode's.
- Tests: a new `spec/plex_import_spec.rb` that calls `Show.plex_add` with stubbed Apple and TMDB lookups. `spec/plex_webhook_spec.rb` stubs `plex_add` throughout, so it can't hold these.
- No change to the webhook controller, `tmdb_episodes`, `appletv_episodes`, the database schema or the front end.
