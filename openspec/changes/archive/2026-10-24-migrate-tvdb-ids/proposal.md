# Proposal

## Why

Search no longer queries TVDB, and since `db-show-season-source` a stored show only gets new seasons from the source matching its id. So about 220 shows that still carry TVDB ids can never be offered a new season. Their TVDB seasons also depend on an API we no longer search. Production has 423 TVDB seasons across 221 shows, and 29 of those shows mix TVDB seasons into an Apple show.

## What Changes

- A one-off script moves every TVDB show and season onto Apple or TMDB ids, with one rule: all of a show's seasons come from one source.
  - All-TVDB shows move to TMDB.
  - An Apple show stays Apple when Apple has every one of its stored seasons, and its TVDB seasons become Apple seasons.
  - An Apple show that Apple can't fully cover moves entirely to TMDB, including its Apple seasons.
- The script runs in two steps:
  1. A dry run asks Apple and TMDB, then writes a plan file with every change and everything it couldn't resolve. It writes nothing to the database.
  2. An apply step makes exactly the plan's changes in one transaction, without calling any API.
- Only ids and the fields that route episode lookups change (`show_collection_id`; a season's `collectionId`, `appleTvId`, `skip`, `count`, `storeId`). Titles, posters, plots and episodes stay as they are.
- Shows with no match, an unrecognized show id, or a would-be id collision are reported and left unchanged.

## Capabilities

### New Capabilities

- `tvdb-migration`: how stored TVDB shows and seasons are moved onto Apple or TMDB ids, through a reviewed plan.

### Modified Capabilities

None.

## Impact

- New script `bin/migrate-tvdb` and its logic in `app/models/tvdb_migration.rb`, with `spec/tvdb_migration_spec.rb`.
- It reuses `Show.tmdb_request`, `Show.appletv_show` and `Show.in_parallel`. Search and add code doesn't change.
- Production data: the `shows` and `seasons` tables on the Postgres at 192.168.40.4. There is no dev copy, so the apply step is preceded by a `pg_dump` of both tables.
- After the apply, those seasons fetch their episodes from TMDB or Apple instead of TVDB.
