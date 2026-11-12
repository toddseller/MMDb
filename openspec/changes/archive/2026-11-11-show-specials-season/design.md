# Design

## Context

See proposal.md for why. The code paths that place, count and name seasons today:

- **Order.** `Show` has `has_many :seasons, -> { order(season: :asc) }`, which the grid captions and `season_numbers` read. `Season.sorted_seasons` (`order(:season)`) orders the drawer's season buttons and the season-switch controller.
- **Counts.**
  - `Show#season_numbers` builds the "1, 3" / "1–3" / count text from every season.
  - `add_season_count` stores `seasonNumbers`, `seasonCount` and `episodeCount` before each save.
  - The drawer uses `show.seasons.count`.
  - The API's `add_show` replies send `show.season_numbers` and `show.seasons.count`.
  - API v2 `/shows` (`Show.basic_info`) sends the stored `seasonNumbers` and `seasonCount`.
- **Captions.** `_my_shows`, `_show_list` and `_updated_show_list` each repeat the same three-way caption.
  - The grid loads seasons with `includes(:seasons)`.
  - `show-collection` fixes the grid's query count, so the caption must work from the loaded seasons.
- **Buttons.** `_show_info` renders `<input type="submit" value="<n>">`.
  - `setDefaultSeason` posts `button.value` to `/users/:id/shows/:id/seasons/<n>`.
  - `users_seasons_controller` finds the season by that number.
- **Other labels.** `_edit_show` heads the dialog "Season <n>, X episodes selected". `_shows_preview` labels each search result "Season <n>" from a result hash.

## Goals / Non-Goals

**Goals:**
- Implement the four spec deltas with one place deciding a season's name, and one deciding which seasons count.

**Non-Goals:**
- Myflix (its own repo and change).
- Renaming a season 0 whose collection name says something else, or changing collection names at all.
- Showing specials in TMDB search results. `tmdb_show` still skips season 0, and only stored seasons reach the results.

## Decisions

**`Season.label(number)` names a season, and `Season#specials?` marks season 0.**
- `label(0)` is "Specials", and any other number gives "Season N".
- The search results hold hashes, not records, so `label` is a class method. Its instance form (`season.label`) serves the drawer and the dialog.
- A view helper was the alternative. The models already own season display text (`season_numbers`), so the method sits with them.

**Specials sort last through one ordering, used by both orders.**
- Both orders become `order(Arel.sql('seasons.season = 0'), :season)`: the `has_many` scope on `Show`, and `Season.sorted_seasons`.
- Postgres sorts `false` before `true`, so season 0 follows the rest.
- The column is table-qualified because the `has_many` order also applies when seasons are joined.

**`Show#regular_seasons` is the seasons that count: `seasons.reject(&:specials?)`.**
- It filters in memory, so the grid's preloaded seasons cost no extra query.
- `season_numbers`, `add_season_count`'s `seasonCount`, the drawer counts, and both API `add_show` replies use it.
- `episode_count` keeps counting every season's episodes.

**One caption method replaces the three copies.**
- `Show#season_caption` gives "Specials" when there are no regular seasons. Otherwise it gives today's text from `regular_seasons`: "Season N" for one, "Seasons …" for two to four, and "N seasons" for five or more.
- The three grid partials call it, which deletes two copies of the same branching.
- The drawer's series line uses it too, in place of its own two-way branch. Its count line becomes one sentence built from `regular_seasons.size` and `episode_count`: "N season(s), M episode(s)", or "Specials, M episode(s)" when there are no regular seasons.

**Season buttons become `<button type="submit" value="<n>">` with the label as content.**
- `setDefaultSeason` already reads `button.value`, so the posted number and the controller don't change.
- The CSS targets `.season-submit` and `#active-season`, not the element, so the look is unchanged. A screenshot before committing confirms that.
- Keeping `<input>` with a `data-season` attribute was the alternative. It changes the JS, the tests and the e2e checks just the same, and keeps the label and the value tangled.

**A data migration resaves shows that have a season 0.** `before_save` then recomputes their stored `seasonNumbers` and `seasonCount`. Without it, `/shows` keeps reporting MythBusters as 15 seasons until something next saves the show. It is a `db/migrate` file with an empty `down`, because the old counts aren't worth restoring. `bin/deploy` already runs migrations.

## Risks / Trade-offs

- [Tests and e2e checks that assert `<input>` season buttons, or `toHaveValue` on `#active-season`] → Update them to buttons, with `toHaveAttribute('value', ...)` in Playwright. The JS unit fixtures (`show-edit`, `season-row`, `drawer` tests) switch to `<button>` markup.
- [The migration loads today's `Show` model, so a later model change could break it on a fresh database] → Tests load `db/structure.sql`, not migrations, and production has already run it by then. That's the same trade-off `AddHandlesToUsers` accepted.
- [Myflix shows season 0 its own way, perhaps first or as "Season 0"] → Out of scope. It reads raw season rows, which don't change.

## Migration Plan

Deploy by tag as usual: `bin/deploy` runs the migration, then restarts. Rollback is reverting the commit; the stored counts then stay as the migration left them, which the old code recomputes on the next save of each show.
