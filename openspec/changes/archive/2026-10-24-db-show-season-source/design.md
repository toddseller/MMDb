# Design

## Context

`Show.get_series` puts the database rows into `series`, then appends the Apple entries, then the TMDB entries. Each append skips an entry whose "Title, Season N" name and year match an entry already in the list. The Apple condition also has `el[:show_collection_id] != s[:show_collection_id] && is_number?(s[:season])`, so an Apple entry always passes against a database row with a different id. For *Lupin* stored with a TMDB id, every Apple season passes. Apple's season 3 then blocks TMDB's season 3 by name.

The database row's `:title` and `:year` come from its show. Apple and TMDB entries carry `:title`, `:year`, `:season` (a string) and `:show_collection_id`. Database `:season` is an integer.

## Goals / Non-Goals

**Goals:**
- Apply the rule in `specs/show-search/spec.md` to Apple and TMDB entries before the existing merge runs.

**Non-Goals:**
- Changing how Apple and TMDB entries merge for shows that aren't in the database, including the Apple id clause between two Apple shows.
- Searching TVDB again for shows stored with a TVDB id.
- Matching database shows whose stored title differs from the source's title.

## Decisions

**Filter first, then leave the merge unchanged.** Before the two append loops, drop every Apple or TMDB entry that belongs to a database show (same downcased title, `same_year?`), unless its `show_collection_id` matches that show's id and its season number (`to_i`) is not in the database. The entries that remain either belong to no database show, or are same-id seasons whose names differ from every database row. The existing conditions already let both kinds through, so lines 44 and 47 stay as they are. Rewriting the merge as one pass was the alternative. It's more code and risks the Apple-versus-TMDB cases the current specs cover.

**Match the show by title and year, not by "Title, Season N".** A missing season has a name no database row carries, so matching by collection name can't tell that it belongs to the database show. Title plus `same_year?` is the rule the spec already uses for "the same show".

**Strict, no fallback.** All four add paths resolve the show with `find_by(show_collection_id) || Show.new`. Any entry with a different id creates a duplicate row, so offering one as a fallback would bring the bug back.

## Risks / Trade-offs

- [A show stored with a TVDB id, or with an id the sources don't return, can't be offered a new season through search] → Use the manual create form or correct the show's id. This is the trade-off the user accepted.
- [A database title that was edited to differ from the source's title (for example "Lupin (2021)") won't match, so today's behavior and the duplicate risk remain for that show] → Out of scope. Spot-check the Lupin search on production after deploy.
- [Two database shows with the same title within a year of each other] → An entry is kept if it matches either show's id. That's acceptable for such a rare case.

## Migration Plan

Code only, no data change. Deploy as usual. Roll back by reverting the commit.
