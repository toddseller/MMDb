# Proposal

## Why

When Plex's first match for a new movie is wrong, MMDb imports the wrong film and keeps it after the owner fixes the match in Plex. Plex sends `library.new` once, before any fix, and a Fix Match sends nothing. MMDb also stores nothing that ties a movie or show to its Plex item, so it can't tell which entry a fix belongs to. The first case is live: on 2026-11-18 Plex added "Madden" as the 2023 film, the webhook saved MMDb movie 5229 (Madden, 2023, Film i Väst), and about five minutes later the owner fixed the match to Madden (2026, Escape Artists). MMDb still shows the 2023 film.

The same one-shot webhook loses episodes. On 2026-11-18 every new episode's webhook arrived, but the import found nothing for The Good Daughter S1E1 and S1E2 (the show search found no show until E3's webhook 40 minutes later) or for Best Medicine S2E8 (Apple's season list most likely didn't have it yet). It logged nothing, and the owner added all three by hand. The sources had caught up within the hour, but nothing tried again.

## What Changes

- Movies and shows store the owner's Plex item ID. The webhook records it on every new import: the movie's ID for movies, and the show's ID for show and episode events.
- A one-time backfill links existing movies and shows to Plex items by name and year. A movie whose only same-name entry has another year is linked too (that is how 5229 gets Plex item 134511). Anything not linked, and every movie linked despite a year gap, is printed as a list for the owner to review. Nothing is corrected by the backfill. A comparison on 2026-11-18 linked about 95% of movies and 97% of shows by name and year within one.
- An hourly correction pass checks the owner's movies added to Plex in the last 7 days. When Plex's current title or year differs from the linked MMDb movie, it imports the right movie, moves the Plex ID to it, and removes the wrong movie from the owner's collection. A missing movie is imported. The pass can also be run by hand.
- A webhook movie import adds an already-stored movie to the owner's collection. Today it does nothing when the row exists, for example when another user added it first.
- The same hourly pass retries episodes. For each episode added to Plex in the last 7 days that MMDb doesn't have, it runs the webhook's episode import again, so an episode the sources didn't know yet arrives once they do. It prints each episode it adds and each one still missing.
- Shows get the stored ID and episode retries only: no automatic correction of show matches.
- Plex's immediate webhook stays, so new titles still appear right away.
- Tautulli's notifier 1, which posts to the nonexistent `/webhooks/tautulli-test` and fails with a 404 on every addition, is turned off. This is a manual step in Tautulli.
- Movie 5229 is left uncorrected on purpose. It is the live check: after the backfill, the pass must replace it with Madden (2026). Plex added it on 2026-11-18, so the pass must run before it leaves the 7-day window: deploy by 2026-11-24.

## Capabilities

### New Capabilities
- `plex-library-sync`: linking MMDb movies and shows to the owner's Plex items, correcting movies whose Plex match the owner fixed after import, and retrying recent movies and episodes the webhook import missed.

### Modified Capabilities
- `plex-webhook`: imports record the Plex item ID, and a movie import adds an already-stored movie to the owner's collection.

## Impact

- Migration adding a Plex ID column to `movies` and `shows`.
- `Movie.plex_add`, `Show.plex_add`, the new backfill and correction code, two rake tasks, and a systemd user timer and service.
- Reads Tautulli's `get_library_media_info`, `get_recently_added` and `get_metadata` (for a missing episode's IDs) with the existing `TAUTULLI_KEY`.
- Server setup: run the backfill once, then link and enable the timer on onyx (documented in `DOCKER_DEPLOYMENT.md`).
- No new dependency.
