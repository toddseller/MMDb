# Proposal

## Why

Searching in Add Movie takes about 7 seconds (`rocky`: 7.3s with the database left out, 3.8s of it Apple, measured on 2026-10-25), because `Movie.get_titles` makes every request one after another and fetches the same Apple movie once per storefront. The search also offers movies the user already has: production's *Rocky* (1976) is stored with a trailing non-breaking space in its director, so the duplicate check sees "Avildsen " and "Avildsen" as different directors and lists Apple's copy next to the stored one. 20 of 4,594 stored movies have that space. The check itself is also wrong: Ruby reads it as `(title differs AND year differs) OR director differs`, so it drops two films by one director released the same year. Show search fixed the same problems on 2026-10-23, and the code it uses to call Apple and TMDB and to run requests in parallel lives inside `Show`, so movies can't share it.

## What Changes

- Movie search reads the database first, then runs the Apple and TMDB lookups at the same time, each fanning out its own requests a few at a time. Results are merged once every source has answered, in the fixed order database, then Apple, then TMDB.
- Two entries count as the same movie when their titles match (ignoring case, with curly single quotes treated as straight), their years are at most one apart, and their directors don't conflict: the directors' last names match, or either is blank. Last names are read from the director text, ignoring every kind of whitespace, including non-breaking spaces, so the stored Rocky and Apple's Rocky are one movie with no data change.
- Apple keeps movies whose title contains the search term, ignoring case, instead of exact matches only. At most 20 movies are fetched (shows stay at 10), ranked exact title first, then titles starting with the term, then titles containing it. The 4 storefronts are searched together, and each unique movie is fetched once, from the first storefront in the order US, UK, CA, AU that has it.
- Apple credits are stored without leading or trailing whitespace of any kind, including non-breaking spaces.
- The edit form's search (`update_title_search`) uses the same Apple and TMDB lookups and merge without the database. It returns an empty list instead of `nil` when TMDB finds nothing, which today breaks the update panel.
- The Apple, TMDB and parallel-request code moves out of `Show` into shared modules used by both models. `Show.get_series` and its merge rules stay in `Show` and behave as before. TMDB calls from movies, including the person-image lookup, switch from the `TMDB_KEY` query parameter to the `TMDB_TOKEN` bearer token that shows already use.
- **BREAKING** (operations only): all TVDB and Heroku code is removed: the TVDB search, episode lookups, token refresh, the Heroku config writer, the `tvdb` branches of episode lookup and Plex import, and the TVDB migration tool (`TvdbMigration`, `bin/migrate-tvdb`). The `TVDB_*`, `HEROKU_KEY` and `TMDB_KEY` settings are no longer read. The 4 shows still stored with TVDB seasons (NOVA, P90, The Bellflower Bunnies, The Truth About Vaccines) were added by hand and get no new episodes; their stored episodes are unchanged, and opening one of those seasons to add episodes lists none.
- Unused helpers in both models are deleted.

Out of scope: cleaning the 20 stored directors with non-breaking spaces and the 6 orphaned TVDB seasons (both harmless after this change); moving `Show.get_series` into its own search module; caching results.

## Capabilities

### New Capabilities
- `movie-search`: how a title search builds its list of movies to add from the database, Apple TV and TMDB: which matches each source contributes, when two entries are the same movie, their priority, and how the outside requests are scheduled. It also covers the edit form's search.

### Modified Capabilities
- `tvdb-migration`: every requirement is removed along with the migration tool.

## Impact

- `app/models/movie.rb`: `get_titles`, `update_title_search`, `search_person` and `appletv_call` rewritten onto the shared modules; unused helpers deleted.
- `app/models/show.rb`: Apple, TMDB and `in_parallel` code moves out; TVDB and Heroku code deleted; `get_series` and its merge rules stay.
- New shared modules in `app/models/` for Apple TV, TMDB, parallel requests and title/year/director matching, plus the movie search itself.
- Deleted: `app/models/tvdb_migration.rb`, `bin/migrate-tvdb`, `spec/tvdb_migration_spec.rb`, and `openspec/specs/tvdb-migration` on archive.
- Settings: `TVDB_APIKEY`, `TVDB_PIN`, `TVDB_USERNAME`, `TVDB_USERKEY`, `TVDB_TOKEN`, `HEROKU_KEY` and `TMDB_KEY` removed from both compose files, `.env.example` and `spec/support/test_env.rb`. `TMDB_TOKEN` must stay set in production (it already is, for shows).
- `spec/`: a new `movie_search_spec.rb` with WebMock stubs for Apple and TMDB movies; `show_search_spec.rb` must pass unchanged.
- Callers keep their entry points: `Movie.get_titles` (search page, v2 and v3 search endpoints, `Movie.plex_add`, e2e seed), `Movie.update_title_search` (edit form, e2e seed), `Show.get_series`.
- No new dependencies, no schema or data changes.
