# Design

## Context

`Show.plex_add` (`app/models/show.rb`) handles both kinds of Plex event:

- `type: 'episode'`: fetches that one episode from TMDB or Apple and saves it if the fetched title matches Plex's title (with a special case for Matlock).
- `type: 'show'`: fetches the latest season (`childCount`) in full and saves every episode.

Both branches build the record with `season.episodes.find_by(tv_episode:) || season.episodes.new(episode)`, so an existing row is saved without the fetched values.

The fetchers return hashes with `title`, `date`, `plot`, `runtime`, `tv_episode` and `preview`. `date` is already a `"%b %-d, %Y"` string (`"Oct 28, 2026"`) or `''` in both sources. TMDB's whole-season fetch drops only `air_date == ''`; Apple's drops nothing. The same fetchers serve adding episodes by hand (`Show.get_episodes`).

`Episode` formats `runtime` from a minute count to `"45 min"` or `"1h 5m"` in a `before_create` callback only. Hand edits from the show editor store whatever text the user typed.

## Goals / Non-Goals

**Goals:**
- Filter and refresh inside `plex_add`, leaving the fetchers and the add-by-hand path untouched.
- A refreshed episode looks the same as one created by the same import, runtime included.

**Non-Goals:**
- Changing which season a show-level event imports.
- Changing the single-episode title match or the Matlock special case.

## Decisions

### Filter after the fetch, in the show-level branch

Before the loop over a show-level season, keep only the fetched episodes whose `date` parses and is `<= Date.today`. Blank or unparseable dates are dropped.

Alternative considered: filtering in `tmdb_episodes` and `appletv_episodes`. Rejected because adding episodes by hand would then stop listing upcoming episodes, and the single-episode branch would need a way to opt out.

### Refresh with find-or-initialize plus assign

Both branches use `season.episodes.find_or_initialize_by(tv_episode: episode[:tv_episode])` and then `assign_attributes(episode)` before `save_show`. A new episode is unchanged, and an existing one takes every fetched field. This replaces the `find_by || new` line in all three places it appears.

Alternative considered: updating only blank fields. Rejected by the owner because placeholder titles such as "Episode 6" aren't blank.

### Format a bare minute count on every save

Change `Episode`'s callback from `before_create :create_duration` to a `before_save` that runs for a new record, or when `runtime` is only digits. Sources give a bare number of minutes, so a refreshed episode is formatted just as a new one is. A hand-entered `"1h 5m"` is left alone, where running the conversion on every save would turn it into `"1 min"`. A bare `"45"` typed into the show editor is now stored as `"45 min"`, like an imported runtime; the owner accepted this, and the `show_info` page-text snapshot changes with it.

Alternative considered: calling the formatter from `plex_add`. Rejected because it's private to `Episode` and the rule belongs with the column.

## Risks / Trade-offs

- [`Date.today` uses the server's time zone, while Apple dates come from UTC timestamps] → Apple dates are formatted with the same server clock, so both sides agree. An episode released in the evening in US time zones can carry the next day's date and be skipped by a show-level event that arrives that night. The single-episode event for its file, or the next show-level event, adds it.
- [Hand edits to an episode are overwritten when Plex reports it again] → The owner accepted this. It only happens for episodes Plex reports again.
- [A show-level event with no aired episodes saves no episodes, so a new show or season isn't created] → Today it would be created holding only placeholders. It's created on the first event that includes an aired episode.
