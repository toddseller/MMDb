# Proposal

## Why

Any password is accepted, including an empty one, through registration, Account Settings and both API signups. Passwords longer than 72 bytes are silently cut to their first 72 bytes by bcrypt. And nothing ends a session early: the web session lives entirely in an encrypted cookie and renews itself on use, and API tokens last until they expire, so changing a password leaves every stolen or forgotten session working for up to 30 days.

## What Changes

- A new password must be at least 8 characters and at most 72 bytes, checked on the server for registration, Account Settings and `/api/v2` and `/api/v3` signup. No rules about character types. Existing passwords keep working until they are changed.
- The Account Settings error message also asks the user to check that a new password has at least 8 characters. Registration already shows the server's reasons.
- Changing the password ends every other web session and invalidates every API token issued before the change. The browser that made the change stays signed in.
- **BREAKING** Sessions and API tokens issued before this change are ended once, so everyone signs in again, MyFlix included.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `user-account`: new password rules, a password change ends the account's other sessions, and the Account Settings error message changes.
- `api-auth`: a token issued before the user's latest password change, or before this change, is rejected.

## Impact

- `app/models/user.rb` (password rules and the password fingerprint), `app/models/jwt_auth.rb` (fingerprint claim and check), `app/helpers/session_helper.rb` (session check), `app/controllers/sessions_controller.rb`, `app/controllers/users_controller.rb`, `app/views/partials/_edit_user.erb` (message text).
- Every signed-in browser request now loads the user once to compare fingerprints; most routes already load it.
- Tests: the `create_user` factory and every spec that signs in with `'secret'` move to a password of at least 8 characters.
- No database change.
