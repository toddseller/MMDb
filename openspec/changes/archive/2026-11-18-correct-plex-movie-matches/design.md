# Design

## Context

See proposal.md for the Madden case. What the code has today:

- `Movie.plex_add(data, user)` looks for a stored row with the exact title and year. If there is none, it searches by title (`get_titles`, which merges stored rows, Apple and TMDB) and saves each result whose title and year match exactly. When a row already exists, it returns without adding it to the user's collection.
- `Show.plex_add` picks the show by title, season and year, or by the episode's IDs. A show row is keyed by `show_collection_id` (Apple or TMDB).
- Movie and show rows store no Plex identifier. Plex's webhook payload carries `ratingKey` (and `grandparentRatingKey` for an episode's show).
- Tautulli reports Plex's **current** titles and years: `get_library_media_info` for a whole library (section 1 is movies, 2 is shows) and `get_recently_added` for recent additions. Checked 2026-11-18: item 134511 reads "Madden 2026", while MMDb has 2023. The same API is already called by `Movie.plex_count` and the newsletter.
- A trial match on 2026-11-18 (name compared as `Match.same_name?` does, year within one) linked 4,296 of 4,530 Plex movies and 837 of 860 shows, with no name matching more than one entry. 110 movies had the same name but a year gap of more than one (Madden among them), and 124 had no same-name entry (mostly spelling, such as "The X Files" against "The X-Files").
- `Show.plex_add` with an episode event returns silently when the show search finds no candidate, and when the source answers with a different episode number (both by spec). On 2026-11-18 that lost The Good Daughter S1E1 and S1E2 and Best Medicine S2E8, although every webhook arrived. For episodes, `get_recently_added` with `section_id=2` gives `grandparent_rating_key`, `grandparent_title`, `parent_media_index` and `media_index`; `get_metadata` gives the episode's `guids`.
- Removing a movie from a collection unlinks it (`movie.users.destroy(user)`) and keeps the row.
- The newsletter runs from a systemd user timer on onyx that calls `docker compose`.

## Goals / Non-Goals

**Goals:**
- Tie each movie and show to its Plex item, so corrections are exact and work for wrong matches with a different title.
- Correct movie 5229 through the normal path: backfill, then the pass.

**Non-Goals:**
- Correcting show matches. Shows get the stored ID and episode retries only.
- Retrying show-level imports. Plex reports single episodes for new additions, which is what was lost.
- Fixing the 110 older year gaps or the 124 unmatched names automatically. They go in the backfill's report for the owner.
- Looser name matching (punctuation, "&" against "and"). The report lists what plain names miss.

## Decisions

**One `plex_key` integer column on `movies` and `shows`, indexed, not unique.** Rows are shared between users, but there is one Plex server and only the owner's imports set it, so one column is enough. It isn't unique because the pass briefly has two rows with the same key between importing the right movie and clearing the wrong one, and stray duplicates from the past shouldn't block a migration. Alternatives: a TMDB ID is the wrong match's ID at import time, so it can't find the entry later. A join table per user adds nothing while only the owner has Plex.

**Webhook records the key.** `Movie.plex_add` sets `plex_key` from `data['ratingKey']` on the row it finds or creates, and links the user if missing (fixing the silent skip when another user stored the movie first). `Show.plex_add` sets the show's key from `ratingKey` for a show event or `grandparentRatingKey` for an episode, on the show it saved into.

**Backfill as a rake task, `plex:link`.** It reads both whole libraries with `get_library_media_info` (`length` large enough for the library, one request each) and only touches the owner's unlinked rows. Pass 1 links name plus year within one. Pass 2, for movies only, links a Plex movie still unlinked to the only unlinked owner movie with its name (this is what links 5229 to 134511). Each Plex item and each row is used at most once, and anything with two candidates is skipped. It prints the unlinked Plex items and the pass-2 links. Running it again only fills in rows that are still unlinked, so it is safe to repeat. Pass 2 is movies only because shows had just 2 such cases and nothing corrects shows.

**Correction pass as `Movie` code plus a rake task, `plex:sync`.** It makes one `get_recently_added` call with `section_id=1&count=100` and keeps items added between 7 days and 10 minutes ago. The newest 10 minutes are left to the webhook, so the two never create the same movie at once (found in review). For each item:
1. Find the owner's movie with that `plex_key`.
2. If there is one and it agrees (`Match.same_name?` and `Match.same_year?`), do nothing.
3. Otherwise call `plex_add` with `{'title', 'year', 'ratingKey'}`, so the search rules stay the webhook's.
4. If the owner now has a movie with that key that agrees with Plex, the old row (if any) loses the owner and its `plex_key`, and both changes are printed. If not, nothing else happens and the next hourly run retries.

Owner only, via `ENV['PLEX_USER_ID']`, like the webhook. The 7-day window keeps automatic changes to fresh additions, so the 110 older gaps are never touched without the owner.

**Episode retries in the same rake task.** After the movies, the task makes one `get_recently_added` call with `section_id=2&count=100` and keeps episodes from the same window. For each one:
1. Find the owner's show by `plex_key` = `grandparent_rating_key`. If none is linked, use the owner's only show with `Match.same_name?` to `grandparent_title`.
2. If that show has a season with `season` = `parent_media_index` holding an episode with `tv_episode` = `media_index`, skip it.
3. Otherwise fetch `get_metadata` for the episode's guids and call `Show.plex_add` with `{'type' => 'episode', 'grandparentTitle', 'grandparentRatingKey', 'parentIndex', 'index', 'title', 'Guid' => [{'id' => guid}, ...]}`, so the webhook's show-picking and episode-number rules apply unchanged.
4. Check again and print "added" or "still missing".

`get_metadata` is called only for missing episodes, so a normal hour costs two Tautulli requests. The fallback by name in step 1 keeps an unlinked show (the backfill missed it) from being re-imported every hour. The import refreshes stored episodes anyway, so a needless import does no harm beyond extra requests. One task, `plex:sync`, runs both, from one service, `mmdb-plex-sync`.

**Tautulli calls** use `HTTParty.get` with `AppleTv::TIMEOUT`, like `Movie.plex_count`. A non-200 response, a missing data key or a timeout raises before any write, so the rake task exits non-zero. A whole-library request may need a longer timeout than `AppleTv::TIMEOUT`; use whatever the trial showed works (the 4,530-movie list came back well within a minute).

**Hourly systemd user timer.** `mmdb-plex-sync.service` runs `docker compose exec -T web bundle exec rake plex:sync < /dev/null` in `~/MMDb`. It reuses the running web container, where the code and `.env` already are. The timer is hourly with `Persistent=true`. A timer was chosen over running on webhook events, which arrive only when something new is added.

## Risks / Trade-offs

- [Pass 2 links a lone namesake that is a different film, not a wrong match] → It is only a link: nothing changes unless that Plex item is also added within the pass's 7-day window and Plex disagrees. Every pass-2 link is in the report.
- [Search dates the film a year off from Plex] → `plex_add`'s exact-year match adds nothing, the old movie stays (guarded), and later runs retry quietly. Accepted with no change to `plex_add`'s matching.
- [Shared row's key belongs to the owner's Plex] → Only the owner's imports and the backfill set it, and only owner rows are linked.
- [5229 leaves the window on 2026-11-25] → Deploy and run the backfill by 2026-11-24.

## Migration Plan

1. Deploy by tag. `bin/deploy` runs the migration.
2. On onyx, run `docker compose exec -T web bundle exec rake plex:link < /dev/null` once and keep its report for the owner. Check that it lists Madden (2023) as linked to Plex's Madden (2026).
3. Link and enable the timer (`systemctl --user link ...` and `enable --now`), as documented.
4. Validate: run `systemctl --user start mmdb-plex-sync.service`, then check that `journalctl --user -u mmdb-plex-sync` shows Madden (2026) added and Madden (2023) removed, and that the owner's collection shows the 2026 film.
5. Turn off Tautulli notifier 1 in Tautulli's settings.

Rollback: disable the timer. The column can stay. Movies the pass removed can be added again from MMDb.
