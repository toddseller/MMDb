# Proposal

## Why

Shows can now store a season 0 for their specials (MythBusters has one since its move to TMDB). MMDb shows it as a season button labelled "0", counts it as a season ("15 seasons" for a 14-season show), and sorts it first. Specials should read as "Specials", sit after the regular seasons, and not count as a season.

## What Changes

- Season 0 is labelled "Specials" wherever MMDb names a season: the drawer's season buttons and season line, the grid tile captions, the edit dialog's heading, and the Add TV Show search results.
- Specials come after the last regular season, in the drawer's season row and wherever a show's seasons are listed in order.
- Specials don't count as a season. Their episodes still count. A show's season count and season numbers leave season 0 out, on the page and in the API's `seasonNumbers` and `seasonCount`. A show with only specials reads "Specials".
- A season button still switches seasons by number; only its label changes.
- Stored season summaries for shows that already have a season 0 are recomputed once, so the API stops reporting the old count.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-drawer`: a show's specials are labelled "Specials", placed last in the season line, and left out of the drawer's season counts.
- `show-collection`: the tile's season label leaves out specials, and reads "Specials" for a show with only specials.
- `show-edit`: the Specials button sets the default season like any other, and the edit dialog names a specials season "Specials".
- `adding-to-collection`: a stored specials season in the search results is listed as "Specials".

## Impact

- `app/models/season.rb`, `app/models/show.rb` (season order, season numbers and counts), and the partials `_show_info`, `_my_shows`, `_show_list`, `_updated_show_list`, `_edit_show`, `_shows_preview`.
- `seasonCount` in the API v2 and v3 `add_show` replies, and the stored `seasonNumbers` and `seasonCount` the v2 `/shows` list returns. Myflix reads these; how Myflix itself shows season 0 is a separate change in its own repo.
- The API's show replies that include season rows (`/api/v2/shows/:id`, `/api/v3/shows`, `/api/v3/shows/:id`) now list season 0 last, because they follow the show's season order.
- One data migration resaves shows that have a season 0, which runs on deploy.
- No change to episode lookups or the Plex webhook, which find season 0 by number.
