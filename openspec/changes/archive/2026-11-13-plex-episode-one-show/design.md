# Design

## Context

`Show.plex_add` calls `get_series(title)`, which merges stored rows, Apple rows and TMDB rows in that order. A TMDB row is dropped when an earlier row has the same name and a year within one. For an episode event, the loop then imports into every row whose title equals Plex's `grandparentTitle` and whose season equals `parentIndex`. Nothing ties a row to the show Plex means. For episodes, Plex's `year` is the year the episode aired, so it can't be compared with a show's start year.

A real episode payload carries `Metadata.Guid`, with the episode's `imdb://`, `tmdb://` and `tvdb://` IDs. The `tmdb://` value is an episode ID, which has no direct lookup. TMDB's `find/{id}?external_source=imdb_id|tvdb_id` returns `tv_episode_results[].show_id` for either of the other two. Checked against live TMDB: the Rivals episode `tt22052954` gives show 208921, and the Midsomer episode `tt0647499` and `tvdb 217309` both give show 764. `tv/{show_id}` then gives `first_air_date`.

## Goals / Non-Goals

**Goals:**
- Pick the candidate rows for an episode event before the import loop, so the loop itself stays as it is.

**Non-Goals:**
- Changing `get_series` or the merge order.
- Applying the ID lookup to show-level events. The year comparison is enough there once it allows one year either way.
- Using Plex's own `grandparentGuid`, which only Plex's API can resolve.

## Decisions

**Narrow the candidates, then require one show.** The episode branch builds the candidates with the existing title and season condition, narrows them (below), and checks that what is left belongs to one `show_collection_id`. If more than one show is left, it logs `"Plex episode skipped, several shows match: <title> S<season>E<episode>"` with `puts`, as the file already logs, and returns. Alternative: stop after the first match. Rejected, because `get_series` sorts by year, so the first match is the oldest namesake (1988 for The Lowdown).

**Resolve the show through TMDB `find`.** Try the `imdb://` ID, then the `tvdb://` ID, and take the first `show_id` returned. One `tv/{show_id}` request then gives the first-air year. Keep a row when it is a TMDB row (`collectionId` starting `tmdb`) whose `show_collection_id` equals `show_id`, or a non-TMDB row whose `year` is within one year (`Match.same_year?`). The title is not compared, because every candidate already matches Plex's title. Alternatives: match Apple rows on a TMDB or IMDb ID. Rejected, because Apple rows carry no external ID. Or compare only stored rows. Rejected, because it can't tell apart two namesakes that are both stored.

**Fall back to stored shows.** When there is no usable ID, `find` returns no episode, either TMDB request raises, or TMDB's show matches no candidate, keep the rows whose `show_collection_id` matches a stored `Show`. Keep every row when none match. Matching on the show, not on the season, keeps a new season of a stored show. The lookup rescues `StandardError` and returns nil, so a TMDB outage only costs the extra precision. `Tmdb.get` doesn't check the status, so a refused `tv/{show_id}` (a 429, say) comes back with no `first_air_date` and every non-TMDB row fails the year check. Falling back whenever TMDB's show leaves no candidate covers that, and covers an Apple year more than one off from TMDB's, without the episode quietly going missing (found in review).

**Show-level year within one, no Matlock line.** The show-level condition compares `s[:year]` with Plex's `year` using `Match.same_year?` instead of `==`, and the `matlock → 2024` line is deleted. `git log` shows no reason recorded for the hardcode (it arrived in the bulk commit `98f1c27`). The likely cause is Plex dating the 2024 Matlock a year off, which a one-year window covers. Matlock (1986) is decades away, so it never matches. Alternative: use the show payload's `Guid` `tmdb://` ID, which is the show's own TMDB ID. Not taken, because a year window is a one-word change and solves the case at hand. If Plex had matched Matlock to the wrong show entirely, neither approach would help, and a new show event for Matlock is unlikely now that it is stored.

**Narrow only after the merge.** The narrowing works on the rows `get_series` returns, so a show both sources list still arrives as its Apple row, and Apple's season and episode are used as today.

## Risks / Trade-offs

- [Two namesakes that started within a year of each other still both match by year] → the one-show check skips and logs, rather than creating a duplicate.
- [Plex numbers seasons differently from TMDB (Midsomer: S3E2 in Plex, S5E3 on TMDB)] → only `show_id` is taken from `find`. Season and episode numbers still come from Plex, as before.
- [One or two extra TMDB requests per episode event] → the webhook isn't time-sensitive. A failure falls back instead of failing the import.
- [Hand-edited test payloads with mismatched IDs] → every spec payload with a `Guid` stubs `find` to answer for that exact episode.

## Migration Plan

No data migration. Deploy as usual by tag. The stray 1988 "The Lowdown" is removed separately by a one-off script after checking its rows.
