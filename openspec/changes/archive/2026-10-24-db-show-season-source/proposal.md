# Proposal

## Why

Searching for a show already in the database also offers that show's seasons from the other source. Adding one of those seasons creates a duplicate show row, because every add path finds the show by `show_collection_id` and creates a new show when no row matches. For example, *Lupin* is stored with its TMDB id and seasons 1 and 2. A search offers Apple's Lupin seasons instead of TMDB's season 3, and adding any of them creates a second *Lupin*.

## What Changes

- When a search result is the same show as one in the database (same title, years at most one apart), the search offers extra seasons only from the source whose `show_collection_id` equals the database show's id, and only seasons the database does not already have.
- Seasons of that show from the other source are dropped, even seasons the matching source lacks.
- No fallback: if no source returns the database show's id (for example, an older show stored with a TVDB id), the search offers only its database seasons.
- Shows not in the database keep today's Apple-over-TMDB priority.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `show-search`: adds a requirement that a show already in the database takes extra seasons only from its own source.

## Impact

- `Show.get_series` in `app/models/show.rb` (the merge step).
- Every caller of `get_series` sees the new results: the Add TV Show page (`shows_controller.rb`), the v2 and v3 search endpoints, and the Plex webhook import (`Show.plex_add`). None of them change.
- `spec/show_search_spec.rb` gains examples. The existing ones keep passing.
