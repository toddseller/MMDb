## ADDED Requirements

### Requirement: Pages carry a report-only content security policy
Every response SHALL carry a `Content-Security-Policy-Report-Only` header that sends violation reports to `/csp-reports` and blocks nothing. Its policy SHALL allow scripts only from the site and the page's import map by its SHA-256 hash; styles only from the site; images from the site, any `https:` host and `data:`; fetches only to the site; no plugins; and the base URL, form targets and framing only for the site.

#### Scenario: A page's import map is allowed
- **WHEN** a visitor requests a page
- **THEN** the response's report-only policy names the SHA-256 hash of that page's import map

#### Scenario: Pages break nothing under the policy
- **WHEN** the browser tests open the site's pages and dialogs
- **THEN** no content security policy violation occurs

### Requirement: Pages use no inline script handlers or inline styles
Pages and the markup scripts add to them SHALL contain no inline event handler attributes and no `style` attributes. A poster image that fails to load SHALL still be replaced with its fallback image, including one that failed before the page's scripts started.

#### Scenario: A missing poster
- **WHEN** a poster image in a movie list fails to load
- **THEN** it is replaced with the animated placeholder, once

#### Scenario: A poster that failed early
- **WHEN** a poster image failed to load before the page's scripts ran
- **THEN** it is replaced with its fallback when the scripts start

### Requirement: Violation reports are logged within limits
`POST /csp-reports` SHALL accept a browser's violation report without a session and answer 204, writing one line to the server log with the violated directive, the blocked address and the page's path, without query strings. A body over 8 KB or one that is not a report SHALL be answered 400 and SHALL NOT be logged.

#### Scenario: A report
- **WHEN** a browser posts a violation report for an image blocked on `/users/1?letter=a`
- **THEN** the response is 204 and the log has one line naming the directive, the blocked address and `/users/1`

#### Scenario: An oversized body
- **WHEN** a client posts 9 KB to `/csp-reports`
- **THEN** the response is 400 and nothing is logged

#### Scenario: Not a report
- **WHEN** a client posts a body that is not a violation report
- **THEN** the response is 400 and nothing is logged
