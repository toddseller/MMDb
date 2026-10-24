# Proposal

## Why

Apple writes some titles with a curly apostrophe and TMDB with a straight one, so the search lists the same show twice. On production, `lupin` returns "Lupin’s Tales" (2020) from Apple and "Lupin's Tales" (2021) from TMDB. Their years are within one, so the names are the only difference.

## What Changes

- When the search compares two names to decide whether they are the same season or the same show, it treats curly single quotes (’ and ‘) as a straight apostrophe ('), as well as ignoring case.
- This covers the Apple and TMDB merge and the check that matches a result to a show already in the database.
- The names shown and stored don't change. Each entry keeps its source's spelling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `show-search`: "The same season means the same name and nearly the same year" now ignores case and the apostrophe style.

## Impact

- `Show.get_series` and `Show.from_stored_source?` in `app/models/show.rb`.
- `spec/show_search_spec.rb` gains examples.
- Callers of the search see fewer duplicates. Their response shape doesn't change.
