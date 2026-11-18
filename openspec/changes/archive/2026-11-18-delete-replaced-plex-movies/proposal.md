# Proposal

## Why

When the hourly Plex sync replaces a wrong match, it removes the wrong movie from the owner's collection but leaves its row in the database, owned by nobody. That row still shows up in movie search. The first replacement, Madden (2023, movie 5229), had to be deleted by hand on 2026-11-18. A row the webhook created for a wrong match belongs to the owner alone, so once it is replaced nothing needs it.

## What Changes

- After removing the replaced movie from the owner's collection, the sync deletes the movie row, along with any ratings on it, unless another user has the movie.
- A replaced movie another user has keeps its row, as today. That can only happen when the webhook linked the owner to a movie that already existed, or another user added it from search before the sync ran.
- The output says "Deleted movie: <title> (<year>)" when the row is deleted, and keeps "Removed movie: ..." when another user keeps it.
- Out of scope: the 27 rows nobody has that predate this (left by ordinary removals), and shows.

## Capabilities

### New Capabilities

### Modified Capabilities
- `plex-library-sync`: the replaced movie's row is deleted when no other user has it, and the output reports the deletion.

## Impact

- `PlexLibrary.sync_movie` in `app/models/plex_library.rb`, and its specs in `spec/plex_library_spec.rb`.
- The "Plex sync" section of `DOCKER_DEPLOYMENT.md`, which says the old row stays.
- No migration, no new dependency. Deploy as usual; the timer picks up the new code on its next run.
