# Design

## Context

See proposal.md for why. The relevant code and runtime:

- Sinatra's cookie session (`enable :sessions` in `config.ru`, signed with `SESSION_SECRET`, key `rack.session`, HttpOnly by default) holds `:user_id`, `:name` and `:theme`. Sign-in (`POST /sessions`), registration (`POST /users`) and the v2/v3 logins set `:user_id`; sign-out (`POST /sessions/:id`) sets `:user_id` and `:name` to nil and `:theme` to `'default'`.
- `current_user` (`app/helpers/session_helper.rb`) reads `:user_id`, but the layout and five other templates read `session[:user_id]`, `[:name]` and `[:theme]` directly. A page that never calls `current_user` still shows "Signed in as".
- `rack-session` writes the cookie back on every request that loaded the session (`commit_session`), and sets its expiry to now + `expire_after` when that option is set for the request. With `secure` set, it skips writing the cookie unless it sees the request as HTTPS (`security_matches?`), which it reads from the scheme or `X-Forwarded-Proto`/`X-Forwarded-Ssl`.
- Production runs the dev compose file, so `RACK_ENV` is `development` on mmdb.online; Cloudflare's tunnel serves it over HTTPS and the container sees plain HTTP.
- Sinatra runs Rack::Protection with `reaction: :drop_session`; the origin check empties `rack.session` for a cross-site POST, which is why the guards answer 401 to one.
- The browser sign-in (`public/js/mmdb/account.js`) posts every filled form field, so a ticked checkbox is sent as-is; its empty-form check counts all filled fields.
- `JwtAuth::SESSION_LIFETIME` (1 day) and `REMEMBERED_LIFETIME` (30 days) already exist for the API logins.

## Goals / Non-Goals

**Goals:**
- One place decides whether a session is live, for every request that carries a session cookie, before any route or template reads the session.
- Expiry, extension, Remember me and the cookie flags with no change to how templates or routes read the session.

**Non-Goals:**
- No revocation: a copied cookie keeps working until its end time.
- No change to the API tokens or to the API logins' session writes; their sessions get the 1-day lifetime like any session without an end time.

## Decisions

### Keep the cookie session; add an end time to it

The session gets `:expires_at` (Unix seconds) and `:remember` (true when Remember me was ticked). Because the session is signed, a browser can't move its own end time.

Alternative considered: a JWT from `JwtAuth` in its own HttpOnly cookie. Rejected for this goal: Rack::Protection's `drop_session` only empties `rack.session`, so a separate token cookie would survive a cross-site POST unless the protection reaction also changed to `:deny`; the six templates that read `session[:user_id]` would have to move to `current_user`; and the test helpers would have to carry two cookies. It would share the token format with v2, but none of the code.

### One check before every request that carries a session cookie

```ruby
before { refresh_session if request.cookies.key?('rack.session') }
```

`refresh_session`, next to `current_user`:

```
signed out (no :user_id)                  -> leave the session alone
:expires_at in the past                   -> sign out (the same three writes as Sign Out)
otherwise (live, or no :expires_at yet)   -> :expires_at = now + lifetime
                                             request.session_options[:expire_after] = lifetime
                                             request.session_options[:secure] = request.ssl?
lifetime = session[:remember] ? REMEMBERED_LIFETIME : SESSION_LIFETIME
```

It is a `before` filter, not part of `current_user`, because templates read the session directly: an expired session must already be signed out when the layout renders, whichever route served the page.

The cookie guard keeps cookie-less requests cookie-less. Reading the session loads it, and `rack-session` then writes a cookie, so without the guard toddseller.com's `/api/movies/count` and `/api/year` calls would start receiving one.

A session with a `:user_id` but no `:expires_at` (from before this change, registration, or the v2/v3 logins) takes the "otherwise" branch, so it gets the 1-day lifetime and is not signed out.

Extension happens on every request rather than past half the lifetime: the cookie is rewritten on every request that loads the session anyway, so a threshold would save nothing.

### Sign-in sets the choice and starts the clock

`POST /sessions` sets `:remember` from `params[:remember] == 'true'` alongside `:user_id`, `:name` and `:theme`, then calls the same extension step, so the response already carries the cookie with its expiry and flags (the sign-in request may arrive without a cookie, which skips the `before` filter).

Sign-out and the expiry branch share one `sign_out!` helper so they stay the same three writes.

### `Secure` follows the request, `SameSite` is fixed

`config.ru` changes `enable :sessions` to `set :sessions, same_site: :lax`. `secure` is set per request from `request.ssl?` in the extension step instead of globally, because:

- a global `secure: true` would make `rack-session` skip writing the cookie for any request it sees as plain HTTP, which would break sign-in if the tunnel's `X-Forwarded-Proto` were missing, and always break the local and e2e servers;
- `RACK_ENV` is `development` in production, so `production?` can't select it.

Over HTTPS through Cloudflare the cookie is `Secure`; if the header were ever missing, the cookie would only lose the flag.

### The empty-form check counts only the credentials

`signIn` in `account.js` decides "empty" from the user name and password fields, so ticking only Remember me still shows the error without a request. Closing the dialog already calls `form.reset()`, which unticks the box.

### Tests travel in time

RSpec includes `ActiveSupport::Testing::TimeHelpers` (already installed with ActiveRecord) and uses `travel` to move past the end time. Request specs read the response's `set-cookie` header for the expiry and flags, and send `'HTTP_X_FORWARDED_PROTO' => 'https'` for the HTTPS case. `RequestHelper` already keeps only the cookie's name and value, so its handling doesn't change.

## Risks / Trade-offs

- [Every signed-in response rewrites the cookie] → it already does today whenever a page reads the session; the only addition is the expiry attribute.
- [The tunnel doesn't send `X-Forwarded-Proto`] → the cookie isn't `Secure` but sign-in still works; the release check looks at the cookie's flags on mmdb.online.
- [Server clock jumps] → a jump forward of a day could sign people out early; the server runs NTP like any Docker host, and the cost is one sign-in.
- [A copied cookie] → still works until it is unused for a day (or 30 days); revocation is out of scope.
- [Everyone's existing session becomes 1-day] → a remembered-feeling browser left alone for more than a day after the deploy signs in again once; they can then tick Remember me.

## Migration Plan

1. Deploy by release tag as usual; no data or settings change. Existing sessions keep working and get the 1-day lifetime on their next request.
2. After the release: sign in on mmdb.online with Remember me and check in the browser's dev tools that the session cookie is `HttpOnly`, `SameSite=Lax`, `Secure` and expires in 30 days; `curl -sI https://mmdb.online/api/year` shows no `set-cookie`.
3. Rollback: the previous tag. Sessions written by this change still carry `:user_id`, so the old code keeps them signed in, now without an end.
