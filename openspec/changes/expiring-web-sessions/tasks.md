# Tasks

Each code task is test-first: write the examples, run them and see them fail for the reason the task names, write the smallest code that passes, then run the whole suite (`bundle exec rspec`, plus `npm test` for JavaScript).

## 1. Branch

- [x] 1.1 Create the `expiring-web-sessions` branch from an up-to-date `master` and verify `git branch --show-current` names it

## 2. Expiry and extension

- [x] 2.1 Include `ActiveSupport::Testing::TimeHelpers` in RSpec's configuration and add `spec/session_expiry_spec.rb` covering, through real requests with `travel`: a session idle 25 hours shows the Sign in button and a write answers 401; one opened every 20 hours for a week stays signed in; a Remember me sign-in idle 29 days stays signed in; a session with `:user_id` but no `:expires_at` stays signed in and gets a 1-day end; a session that expires gets the same `:theme` as Sign Out. Verify the expiry examples fail because sessions never end
- [x] 2.2 Add `sign_out!` and `refresh_session` to `app/helpers/session_helper.rb`, the cookie-guarded `before` filter, and make `POST /sessions/:id` use `sign_out!`; verify the spec, `account_spec.rb` and the full suite pass

## 3. Remember me

- [x] 3.1 Extend the spec: signing in with `remember=true` gives a cookie expiring in 30 days, without it in 1 day; verify both fail before the change (the cookie has no expiry)
- [x] 3.2 Make `POST /sessions` store `:remember` and run the extension step; add the Remember me checkbox (`name="remember" value="true"`) to the sign-in dialog in `app/views/layout.erb`; verify the spec and the full suite pass
- [x] 3.3 Add a `spec/js/account.test.js` case where only Remember me is ticked and both fields are empty, expecting the error line and no request, and one that closing the dialog unticks it; see the first fail, then make `signIn` count only the user name and password fields; verify `npm test` and `npm run typecheck` pass
- [x] 3.4 Add an e2e example in `e2e/account.spec.js` that ticks Remember me, signs in, and finds the session cookie expiring about 30 days out; verify it passes with `npx playwright test e2e/account.spec.js`

## 4. Cookie flags

- [x] 4.1 Extend the spec: a signed-in response's session cookie has `HttpOnly` and `SameSite=Lax`, has `Secure` when the request carries `X-Forwarded-Proto: https` and not over plain HTTP, and a plain-HTTP sign-in still signs in; and `GET /api/year` and `/api/movies/count` (with Tautulli stubbed) with no cookie set no cookie. Verify the flag examples fail before the change
- [x] 4.2 Change `enable :sessions` to `set :sessions, same_site: :lax` in `config.ru` and set `secure` from `request.ssl?` in the extension step; verify the spec and the full suite pass

## 5. Integration checks

- [x] 5.1 Run `bundle exec rspec`, `npm run typecheck`, `npm test` and `npx playwright test`; verify all pass
- [x] 5.2 Run `/ponytail:ponytail-review` on the full diff and resolve its findings before the first commit

## Workflow follow-up

- Commit on the branch, archive the change in the same PR once the work is done, and open the PR with `gh`; the user merges it.
- After the release, run design.md's Migration Plan checks on mmdb.online: the cookie's flags and 30-day expiry with Remember me, and no cookie on `/api/year`.
