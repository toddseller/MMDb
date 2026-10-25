# Proposal

## Why

A web sign-in never ends. The session cookie has no expiry and the session holds no end time, so a signed-in browser, or anyone holding a copy of its cookie, stays signed in until `SESSION_SECRET` changes, and signing out only clears the one browser that signs out. The web sign-in dialog also has no Remember me choice, which the v2 API has had for a while. The cookie sets neither `SameSite` nor `Secure`.

## What Changes

- A web session ends after a day without use. The sign-in dialog gains a Remember me box; with it ticked, the session ends after 30 days without use.
- Every request from a signed-in browser pushes the end back by the full lifetime, so someone using the site is never signed out mid-use.
- Once a session has ended, the next request treats the browser as signed out: pages show the Sign in button, and writes answer 401 as they do for any visitor.
- Sessions that exist before this change, and sessions that start any other way (registering, the v2 and v3 logins), get the 1-day lifetime from their next request, so nobody is signed out at deploy.
- The session cookie is sent with `SameSite=Lax`, and with `Secure` whenever the request reached the site over HTTPS (mmdb.online, through Cloudflare). Production runs with `RACK_ENV=development`, so this can't key on the environment.
- Requests that carry no session cookie, such as toddseller.com's calls to `/api/movies/count` and `/api/year`, still get no cookie back.

Out of scope: ending a session from another browser or after a password change (revocation); a JWT cookie, considered and rejected in design.md; the API's own tokens.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `user-account`: signing in offers Remember me, and a web session ends after 1 day, or 30 days with Remember me, without use; its cookie is `SameSite=Lax`, and `Secure` over HTTPS.

## Impact

- `app/views/layout.erb`: a Remember me checkbox in the sign-in dialog.
- `public/js/mmdb/account.js`: the empty-form check ignores the checkbox, so a form with only Remember me ticked still shows the error without contacting the server.
- `app/controllers/sessions_controller.rb`: sign-in records the lifetime choice and the end time.
- `app/helpers/session_helper.rb`: one check, run before each request that carries a session cookie, that ends an expired session or extends a live one.
- `config.ru`: the session cookie's `same_site` option; `secure` is set per request in the session check.
- `spec/`, `spec/js/`, `e2e/`: tests for expiry, extension, Remember me, old sessions, the cookie flags and the cookie-less API requests.
- No new dependency, no data or schema change, no new settings.
