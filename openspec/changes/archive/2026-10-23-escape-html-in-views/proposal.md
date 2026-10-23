# Proposal

## Why

MMDb's web pages print stored text without escaping: Sinatra's ERB doesn't escape by default and nothing turns it on, so all 301 `<%= %>` outputs in the 37 views render as raw HTML. Titles, plots, posters and form values come from users (any logged-in user can add shows and movies, through the pages and `/api/v2/add_show`) and from external APIs, so a title containing markup runs as script for everyone who views it: a stored XSS on mmdb.online, found while securing the React app in `secure-api-tokens-and-webhook`. Escaping alone isn't enough either: 87 outputs sit in unquoted attributes such as `alt=<%= "#{movie.title} Poster" %>`, where text with a space can add its own attributes without any `<` or quote.

## What Changes

- Every `<%= %>` in the views escapes its output by default; the only raw outputs are the page layout's `yield` and the embedded partials, written as `<%== %>`.
- Stored text displays as it does today: HTML entities already in the data (`&amp;` in 1 show title and in 1,689 show, season, episode and movie plots in production) are decoded before escaping, so `&amp;` still shows as `&` rather than literally.
- Every attribute value that comes from an output is quoted.
- Specs render the main pages with hostile titles and plots and check that no markup or attribute is injected and that entities display decoded; a view check fails the suite if any attribute output is unquoted or any raw output is anything but a partial or `yield`.
- New gem: `erubi` (ERB with escaping, which Tilt uses for `.erb` once it is installed).

## Capabilities

### New Capabilities
- `web-page-escaping`: how MMDb's own web pages present stored and API-supplied text: escaped by default, entities decoded, attributes quoted, and raw HTML limited to the layout and partials.

### Modified Capabilities
None.

## Impact

- `Gemfile`/`Gemfile.lock` (`erubi`), `config.ru` (ERB options), a view text helper in `app/helpers`, the 32 files under `app/views` that contain outputs (raw outputs and attribute quoting), new specs for pages and views.
- No data changes: entities stay in the database and are decoded at display.
- The JSON APIs and the React app are unaffected; the XHR responses that return rendered `page` HTML use the same templates and are escaped too.
- Production: deploy with `docker compose up -d --build`, since the gems change.
