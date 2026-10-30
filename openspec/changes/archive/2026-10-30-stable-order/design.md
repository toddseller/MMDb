# Design

## Context

Every list in the app goes through three scopes on each model: `sorted_list`, `top_movies` (movies only) and `recently_added`. Callers chain onto them (`user.movies.sorted_list`, `filter_movies(...).sorted_list`, `.paginate`, `.first(10)`, `[0, 6]`), so fixing the scopes fixes every caller. The database is Postgres, which gives no order guarantee for tied rows.

## Goals / Non-Goals

**Goals:**
- Each scope ends in a unique column, so the order is total.

**Non-Goals:**
- Changing the primary sort of any list, such as how `sort_name` drops leading articles.
- Episode and season ordering. `tv_episode` and `season` are unique within their parent in practice, and nothing reported them.
- New indexes. The collections are a few hundred rows per user.

## Decisions

- **Tiebreak on `id`.** It is unique and already indexed, and it follows insertion order, which is what "added first" means in the specs. Alternatives: `title` (not unique, since remakes share it) or `created_at` (can tie within a Plex import). `sorted_list` and `top_movies` take `id` ascending, so the movie held longest wins a tie. `recently_added` takes `id` descending to match its own `created_at` descending.
- **Delete `Movie.basic_info`'s Ruby `sort_by`** instead of making it stable. The query already returns rows in `sorted_list` order. The re-sort on `sort_name` alone is unstable and can only scramble ties. `Show.basic_info` never had one.
- **Tests use real tied rows in Postgres, with the first row touched after insert.** Unfixed, Postgres tends to return tied rows in their physical order, which matches insertion order, so a naive test would pass before the fix. After inserting both rows, the test updates the first one. An `UPDATE` writes a new row version at the end of the table, so an unfixed scan returns the later row first and the test fails for the right reason. Asserting on the generated SQL was rejected: it pins the implementation, not the order.

## Risks / Trade-offs

- [The first failing run depends on Postgres physical order] → The update trick above makes an unfixed query return the later-inserted row first on a sequential scan. If the planner ever picks an index scan on `sort_name`, the test still checks the right thing but may not fail first; the apply step shows the failure before changing code.
- [API clients that relied on the old tie order] → There was no stable tie order to rely on, so none can.
