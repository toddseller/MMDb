# Proposal

## Why

MMDb sends no Content-Security-Policy, so if markup were ever injected into a page (a title, a pasted poster URL), the browser would run any script in it. Escaping is the first defense and is already in place; a CSP is the backstop that stops injected script from running. The pages are close to ready for a strict policy: the only inline script is the import map, and the only other blockers are three `onError` image handlers and nine inline `style` attributes. Starting in report-only mode lets real traffic show what an enforced policy would break before it breaks anything.

## What Changes

- The three `onError="..."` handlers on poster images become a `data-fallback` attribute, handled by one listener in a new `fallback.js` module. The fallback images are unchanged.
- The nine inline `style` attributes (seven poster images, `#meta-data`, and the preview placeholder in `preview.js`) become CSS classes. Nothing looks different.
- Every response carries `Content-Security-Policy-Report-Only` with a strict policy: scripts and styles from the site only (plus the import map by its hash), images from the site and any `https:` host, fetches to the site only, no plugins, no foreign forms or framing.
- A new `POST /csp-reports` endpoint receives the browser's violation reports and writes one short line per report to the server log, with a size cap.
- The browser tests fail on any CSP violation, so a page that would break under enforcement fails CI first.
- Enforcing the policy is out of scope: it follows as its own small change once the logs come back clean.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `origin-security`: adds the report-only policy, what it allows, and the report endpoint and its limits.

## Impact

- Views: `_movie_list.erb`, `_my_movies.erb`, `_episodes_preview.erb` (fallbacks); `_filtered_list.erb`, `_movie_list.erb`, `_my_movies.erb`, `_my_shows.erb`, `_show_list.erb`, `_top_movies.erb`, `_updated_show_list.erb`, `_show_info.erb` (styles).
- Scripts: new `public/js/mmdb/fallback.js`, started from `main.js`; `preview.js` placeholder.
- CSS: classes for the moved styles.
- Server: the header and the report route; an existing helper (`import_map`) supplies the hash input.
- Tests: RSpec for the header and endpoint, JS unit tests for the fallback, a Playwright fixture that fails on violations.
- No API, MyFlix or iOS change: the header has no effect on JSON responses.
