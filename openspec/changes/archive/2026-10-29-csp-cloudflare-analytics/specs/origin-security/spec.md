## MODIFIED Requirements

### Requirement: Pages carry a report-only content security policy
Every response SHALL carry a `Content-Security-Policy-Report-Only` header that sends violation reports to `/csp-reports` and blocks nothing. Its policy SHALL allow scripts only from the site, Cloudflare Web Analytics (`https://static.cloudflareinsights.com`) and the page's import map by its SHA-256 hash; styles only from the site; images from the site, any `https:` host and `data:`; fetches only to the site and `https://cloudflareinsights.com`; no plugins; and the base URL, form targets and framing only for the site.

#### Scenario: A page's import map is allowed
- **WHEN** a visitor requests a page
- **THEN** the response's report-only policy names the SHA-256 hash of that page's import map

#### Scenario: Pages break nothing under the policy
- **WHEN** the browser tests open the site's pages and dialogs
- **THEN** no content security policy violation occurs

#### Scenario: Cloudflare Web Analytics is allowed
- **WHEN** Cloudflare adds its Web Analytics script to a page
- **THEN** the policy allows the script to load and to send its measurements
