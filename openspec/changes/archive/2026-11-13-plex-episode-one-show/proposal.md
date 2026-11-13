# Proposal

## Why

A Plex episode event for The Lowdown (2025) added the episode to the right show, and also created a second, unrelated "The Lowdown" (the 1988 TMDB series, id 32977). For an episode event, `Show.plex_add` imports into every search result whose title and season number match, and it never checks the year. Any title that has a namesake with an overlapping season number can do the same thing. The owner keeps several same-titled pairs (both versions of The Office), and others where only one version is owned (US Ghosts, not UK). So an episode has to reach exactly one show, and title plus season number can't identify it.

## What Changes

- A single-episode import picks one show before it imports anything. Plex's episode payload carries the episode's own IMDb and TVDB IDs in `Guid`. TMDB's `find` endpoint turns either ID into the episode's show, and from that show the import gets its first-aired year. Candidates are narrowed to that show: a TMDB candidate by its show ID, an Apple or stored candidate by year (one year either way, as the search merge already allows).
- With no usable `Guid`, or when TMDB can't place the episode, the import falls back to the candidates that belong to a show already in the database. If none are stored, every candidate is kept.
- If more than one show is still left after narrowing, the import adds nothing and logs the title, season and episode, so the episode can be added by hand. It never creates a show by guessing.
- The source order stays as it is (database, then Apple, then TMDB). The narrowing runs on what the search merge returns, so it never brings back a TMDB row the merge dropped in favour of Apple.
- A show-level import accepts a candidate whose year is within one year of Plex's year, instead of exactly equal to it. The hardcoded `matlock → 2024` year goes: it only made up for an exact comparison, and one year either way still keeps the 2024 Matlock apart from the 1986 one.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plex-webhook`: adds the requirement that a single-episode import goes into exactly one show, chosen by the episode's IDs, with the stored-show fallback and skip-and-log when it is still ambiguous. Adds the requirement that a show-level import matches the show's year within one year, with no per-title exceptions.

## Impact

- `app/models/show.rb`: the episode branch of `Show.plex_add`, the show-level year comparison and the `matlock` line, plus a small helper that turns the episode IDs into a TMDB show through `Tmdb.get`.
- `spec/plex_import_spec.rb`: new examples for the Lowdown case, two stored namesakes, the stored-show fallback and the skip-and-log case, with stubbed TMDB `find` and `tv/{id}` responses. Payloads with a `Guid` must use IDs that agree with their title, season and episode.
- One or two extra TMDB requests per episode event. If they fail, the fallback runs; the webhook still answers 204.
- Not in scope: removing the stray 1988 "The Lowdown" from production (a separate one-off script), and the existing gap where a season TMDB has but Apple lacks is dropped by the search merge.
