# Design

## Context

- `User#password=` hashes whatever it is given with bcrypt; the model only validates that `password_hash` is present. bcrypt 3.1.22 truncates secrets longer than 72 bytes before hashing.
- Passwords are set in three places:
  - `post '/users'`: registration, which redirects to `/users/new?errors=...`, and the page prints the errors.
  - `put '/users/:id'`: Account Settings, which answers `status: "false"`, and the dialog shows one fixed message. When the current password field is empty, the route keeps `password_hash` and never calls `password=`.
  - `post '/signup'` in both API versions, which answers 422 with `errorMessage`.
- Web sessions are Rack's cookie store, encrypted with `SESSION_SECRET`. `refresh_session` runs before every route that has a session cookie, signs out an expired session and extends a live one; it never touches the database. Sessions are started by `post '/sessions'`, by registration, and, without an end time, by the API logins.
- API tokens are HS256 JWTs from `JwtAuth.token`. Both namespaces' `authenticate!` call `JwtAuth.decode` and turn any `JWT::DecodeError` into a 401 with its message.
- Every password change produces a new bcrypt salt, so `password_hash` changes even if the same password is set again.

## Goals / Non-Goals

**Goals:**
- The length rule and the session rule in specs/user-account and specs/api-auth, with no database change.

**Non-Goals:**
- Server-side session storage, a per-device "sign out everywhere" button, or ending other sessions on Sign Out.
- Checking passwords against breach lists, or rules about kinds of characters.
- Client-side length checks in the forms: the server's answer already reaches both forms.
- The API logins' habit of also writing `session[:user_id]`: those sessions carry no fingerprint, so after this change they are signed out on their next request, which no client relies on.

## Decisions

**The length rule lives in `User`.** `password=` keeps the plain value in an instance variable for the rest of that object's life. A validation that runs only when that variable is set adds "must be at least 8 characters" or "must be at most 72 bytes" to `password`. One rule covers all three paths, each path already reports the model's errors, and records loaded from the database (old passwords) are never checked. Rejected: checking in each controller (three copies).

**`User#password_fingerprint` is the SHA-256 hex digest of `password_hash`.** It changes whenever the password does, and reveals nothing usable. The salt is inside the hash, so nobody holding the digest can test password guesses against it. Rejected: a `password_changed_at` column (a schema change on production, which this repo applies by hand), or putting the hash itself in a cookie or a token anyone can decode.

**Web: the session stores `:password_fingerprint`, and `refresh_session` compares it.**
- `post '/sessions'` and registration store it next to `:user_id`.
- `refresh_session` loads the user once and keeps it as `@current_user`, so `current_user` doesn't load it a second time. It signs the session out when the user is gone or the fingerprints differ. A session with no fingerprint fails the comparison, which is how sessions from before this change end.
- `sign_out!` also drops the fingerprint and `@current_user`.
- `put '/users/:id'` stores the new fingerprint after a successful save, so the browser that changed the password stays signed in.

Cost: one indexed lookup per request from a signed-in browser.

**API: tokens carry a `pwd` claim with the fingerprint, and `JwtAuth.decode` checks it.** After the signature, issuer and expiry checks, it raises `JWT::DecodeError` ("Sign in again") unless the token's user exists and their fingerprint equals `pwd`. Both `authenticate!` methods already turn that into a 401 with the message, so neither controller changes. A token with no `pwd`, which is every token issued before this change, fails the comparison.

**Settings message:** `_edit_user.erb`'s text becomes "Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters." The dialog already shows this paragraph for every refused save. It is a visible change, so it gets a screenshot for approval before the commit.

**Tests:**
- The `create_user` factory default and every spec that signs in with `'secret'` move to `'secret-password'` before the rule lands, so the rule's failures are the only failures.
- A new `spec/password_rules_spec.rb` covers the three paths at 0, 7, 8, 72 and 73 bytes.
- A new `spec/password_change_spec.rb` covers sessions: two browsers by saving and swapping `RequestHelper`'s `@cookie`; signed-in state read as `spec/session_expiry_spec.rb` does; the fingerprint-less session through `post '/api/v2/authenticate'`, the one live path that still writes such a session; and tokens before and after a password change.
- `spec/api_auth_spec.rb`'s hand-built tokens gain the `pwd` claim.

## Risks / Trade-offs

- [Everyone, including MyFlix users, is signed out once at deploy] → Intended (proposal, BREAKING); it is the only way to end sessions whose fingerprint is unknown.
- [A user changes their password and MyFlix in another tab starts failing] → Intended: that is the rule. MyFlix already handles a 401 by asking the user to sign in.
- [A test or e2e fixture still uses a short password] → The e2e seed passwords are all at least 8 characters (checked); RSpec's are moved in the first task group.

## Migration Plan

Code-only: `bin/deploy` restarts the web container. Afterwards, sign in on the site and in MyFlix (both will ask), then change the password on the site and confirm MyFlix asks again while the site stays signed in. Rollback is a revert; sessions and tokens issued meanwhile still work, because the old code ignores the extra session key and claim.
