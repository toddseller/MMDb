# Design

## Context

TVDB seasons store `collectionId` as `tvdb<TVDB id><season>`. Their show's `show_collection_id` is the TVDB id, an Apple id, or occasionally an id that was already changed. Episode lookups pick their source per season: a non-blank `skip` means Apple (by `appleTvId`); otherwise the `collectionId` prefix chooses TVDB or TMDB. Adding seasons finds shows by `show_collection_id` and seasons by `collectionId`.

These counts come from read-only runs on 2026-10-24:
- 188 all-TVDB shows, 29 Apple shows with TVDB seasons, 1 show already on a TMDB id, 1 unrecognized id (NOVA).
- 3 shows have no TMDB match, and 3 TVDB seasons belong to deleted shows. There were no id collisions.
- Apple's show lookup is flaky: three shows came back empty on one run and complete on the next.

## Goals / Non-Goals

**Goals:**
- Implement `specs/tvdb-migration/spec.md`. What gets applied is decided by a plan a person has read.

**Non-Goals:**
- Changing titles or artwork, merging duplicate shows, or deleting seasons whose show is gone.
- Removing the TVDB code (`tvdb_episodes`, `use_tvdb`), which is a separate change.
- Moving Apple shows that Apple fully covers to TMDB.

## Decisions

**Logic in `TvdbMigration`, with `bin/migrate-tvdb` as a thin entry point.** `app/models/tvdb_migration.rb` holds `plan` (returns the plan hash) and `apply(plan)`. The `bin` script handles arguments, file I/O and printing:
- `bin/migrate-tvdb plan <file>`
- `bin/migrate-tvdb apply <file>`

That lets the specs call the class directly with WebMock, as `show_search_spec.rb` does, instead of driving a subprocess. A Rake task was the alternative. The project's other operational script is `bin/deploy`, so `bin/` matches.

**The plan is JSON, one entry per show:** id, title, route (`apple`, `tmdb` or `unresolved` with a reason), and for the show and each season to change, the row id plus `from` and `to` for each changed field. Totals and the unresolved list follow. JSON is readable and diffable between runs. The `from` values double as the apply step's stale check.

**Reuse the existing source calls.** For TMDB:
1. `Show.tmdb_request` on `/3/find/<tvdb>?external_source=tvdb_id`.
2. `Show.tmdb_request` on `/3/tv/<id>` for its season numbers.

For Apple, `Show.appletv_show(id, store)`, trying the show's stored `storeId` first and then `APPLE_STORES` in order until one returns seasons. Run them through `Show.in_parallel` with a small limit, as the dry runs did. A failed request (a nil result) makes that show unresolved, not routed. An Apple answer that is empty in every store counts as "Apple doesn't recognize it" and routes to TMDB. A flaky empty answer then shows up in the plan for review, which is why apply never asks again.

**Apply in one transaction with `update_columns`.** That skips the `before_save` callbacks (`create_search_name`, `add_season_count`), which would recompute fields this migration doesn't own. Before writing anything, the apply step loads every planned row and compares its current values with `from`. Any mismatch raises before the first write.

**Backup with a throwaway Postgres client.** `pg_dump` isn't installed on the server or in the web container. Run it with `docker run --rm postgres:11 pg_dump -t shows -t seasons "$DATABASE_URL" > ~/mmdb-shows-seasons-<date>.sql`. Version 11 matches the server.

## Risks / Trade-offs

- [Apple flakiness puts a healthy Apple show on the TMDB route] → It's visible in the plan, which is reviewed before applying. Rerun the dry run if a well-known Apple show is routed to TMDB.
- [TMDB's episode numbering differs from TVDB's for some season, for example specials or split seasons] → Season numbers are checked to exist, but episode lists aren't compared. Existing episode rows stay, and only new episode lookups use TMDB. Spot-check a few converted shows after applying.
- [The `tmdb<id><season>` format is ambiguous, for example id 1234 season 12 against id 12341 season 2] → The format is pre-existing. The collision check catches any clash this migration would create.
- [Bad apply] → Restore the two tables from the `pg_dump`.

## Migration Plan

1. Merge and deploy as usual.
2. On the server: `docker compose exec -T web bin/migrate-tvdb plan tmp/tvdb-plan.json`. Copy the plan locally and review it with the user.
3. Take the `pg_dump` backup.
4. Run `docker compose exec -T web bin/migrate-tvdb apply tmp/tvdb-plan.json`.
5. Run the dry run again. It should list only the unresolved shows.
6. Spot-check episodes for one show from each route.

Rollback: restore `shows` and `seasons` from the dump.
