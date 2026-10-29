# origin-security Specification

## Purpose
Defines what the MMDb server reveals to visitors and who can reach it: error pages that hide the app's internals, signing secrets the server will not run without, and a web port reachable only through the Cloudflare tunnel.

## Requirements

### Requirement: Error pages do not reveal the app's internals
When a request fails with an unexpected error, the response SHALL contain no stack trace, file paths, gem versions or exception messages, in every environment the server runs in, including `development`. This covers errors raised inside the app and errors that escape it to the web server. The error details SHALL still be written to the server log.

#### Scenario: Missing record on the server
- **WHEN** a visitor requests `/users/999999999` and no such user exists
- **THEN** the response is a 500 whose body does not mention the exception, any `.rb` file or any gem

#### Scenario: Error that escapes the app
- **WHEN** a request fails with an error that no part of the app handles, on the production server
- **THEN** the response is a 500 with an empty body, not the web server's stack trace

#### Scenario: Error still logged
- **WHEN** a request fails with an unexpected error
- **THEN** the exception and its backtrace appear in the server log

### Requirement: The server does not start without its signing secrets
The server SHALL refuse to start when `SESSION_SECRET` or `JWT_SECRET` is missing or blank, and SHALL name the missing variable when it stops. It SHALL never sign sessions or tokens with a built-in default secret.

#### Scenario: Session secret missing
- **WHEN** the server starts with `SESSION_SECRET` unset or blank
- **THEN** it exits with an error that names `SESSION_SECRET` and serves no requests

#### Scenario: Token secret missing
- **WHEN** the server starts with `JWT_SECRET` unset or blank
- **THEN** it exits with an error that names `JWT_SECRET` and serves no requests

#### Scenario: Both secrets set
- **WHEN** the server starts with both secrets set
- **THEN** it starts normally

### Requirement: The web port is reachable only from the server itself
The web container's port SHALL be published on the host's loopback address only. Production traffic SHALL reach the app through the Cloudflare tunnel, which connects to the container over the Docker network.

#### Scenario: Request from another machine on the network
- **WHEN** another machine on the home network requests `http://<server LAN address>:4666/`
- **THEN** the connection is refused

#### Scenario: Request through Cloudflare
- **WHEN** a visitor requests `https://mmdb.online/`
- **THEN** the page loads as before

#### Scenario: Local Docker development
- **WHEN** a developer runs the app with `docker compose up` on their own machine
- **THEN** it answers at `http://localhost:4666`

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

### Requirement: The database password can stay out of the environment file
The web container SHALL be able to take its database password from a password file on the host, named by `PGPASS_FILE` in `.env`, when `DATABASE_URL` carries no password. The file SHALL be mounted read-only. When `PGPASS_FILE` is not set, the container SHALL start and connect exactly as before, with the password in `DATABASE_URL`.

#### Scenario: Password from the file
- **WHEN** `.env` sets `PGPASS_FILE` to a password file with an entry for the database, and `DATABASE_URL` has no password
- **THEN** the app connects to the database

#### Scenario: No password file configured
- **WHEN** `.env` does not set `PGPASS_FILE` and `DATABASE_URL` includes the password
- **THEN** the container starts and the app connects as it did before
