# Tasks

Test-first throughout: write the test, run it and see it fail for the right reason, then write the smallest code that passes, then run the whole suite. MMDb work is on the branch `secure-api-tokens-and-webhook`; myflix work is on a branch of the same name in `~/Development/Myflix Projects/myflix`.

## 1. MMDb branch

- [x] 1.1 Create the branch `secure-api-tokens-and-webhook` from `master` in MMDb; verify `git status -sb` shows it

## 2. Token lifetime (spec: api-auth, login and signup)

- [x] 2.1 Write `spec/api_auth_spec.rb` for both `/api/v2` and `/api/v3`: a login with `remember: true` returns a token whose `exp` is 30 days after its `iat`; a login without `remember` and a signup return tokens whose `exp` is 1 day after `iat`; a wrong password gets a 401 with no token. Decode with the test secret. Run it and see the lifetime examples fail because the token has no `exp`
- [x] 2.2 Give `JwtAuth.token` a required `lifetime:` keyword with named 30-day and 1-day constants, pass it from both `/authenticate` routes (30 days when `params[:remember]` is `true` or `"true"`) and both `/signup` routes (1 day), and update `spec/settings_spec.rb` to pass a lifetime (design decision 1); verify 2.1 and the whole suite pass

## 3. Token verification (spec: api-auth, rejection and acceptance)

- [x] 3.1 Extend `spec/api_auth_spec.rb`: `GET /api/v2/counts` and `/api/v3/counts` answer 401 with a JSON `message` for an expired token, a token without `exp`, a token signed with another secret, a token from another issuer, and no `Authorization` header, and answer 200 for a valid token. Run it and see the no-`exp` and other-issuer examples fail (the rest pass today, describing current behavior)
- [x] 3.2 Add `verify_iss: true` and `required_claims: ['exp']` to `JwtAuth.decode` (design decision 2); verify 3.1 and the whole suite pass

## 4. Plex webhook secret (spec: plex-webhook)

- [x] 4.1 Write `spec/plex_webhook_spec.rb`, with `Show.plex_add` and `Movie.plex_add` replaced by expectations so no import runs: the correct `token` with a `library.new` show event from `PLEX_USER` answers 204 and calls `Show.plex_add` once; a wrong token, no token, and an unset `PLEX_WEBHOOK_SECRET` (removed for that example and restored after) answer 401 and call nothing; another account or another event with the correct token answers 204 and calls nothing; cover both the `payload` form field and a JSON body. Run it and see the 401 examples fail with 204
- [x] 4.2 Add a `PLEX_WEBHOOK_SECRET` test value in `spec/spec_helper.rb`, add the `before` check to the webhook namespace using `Rack::Utils.secure_compare` (design decision 3), and add `PLEX_WEBHOOK_SECRET` to `.env.example` with a note that the Plex webhook URL must end in `?token=<value>`; verify 4.1 and the whole suite pass

## 5. myflix branch from GitHub (design decision 6)

- [x] 5.1 In the myflix repo, stash the uncommitted tree with `git stash push -u -m "live copy before secure-api-tokens-and-webhook"`, add `origin` as `https://github.com/toddseller/Myflix`, fetch, and create `secure-api-tokens-and-webhook` from `origin/master`; verify `git log -1` shows `b918c03` and `git stash list` shows the stash
  - Note: `origin` already pointed at `git@github.com:toddseller/Myflix.git` (it had not been fetched since 2020), so it was fetched rather than added.
- [x] 5.2 Set `baseURL` in `frontend/client/src/apis/mmdb.js` to `https://mmdb.online/api/v2`, as on the live site; verify `git diff` shows only that line
- [x] 5.3 Confirm the test toolchain runs: `docker run --rm -v "$PWD/frontend/client":/app -w /app node:14 sh -c "yarn install --frozen-lockfile && CI=true yarn test --watchAll=false --passWithNoTests"`; verify it exits 0. If `yarn install` fails on the Dependabot pins, apply design decision 7's fallback and record it here

## 6. Sign out on 401 (spec: myflix-client-security, rejected login)

- [x] 6.1 Write `frontend/client/src/apis/sessionExpiry.test.js` against a fake axios instance, fake storages, a dispatch spy and a history spy: a 401 removes `myflixUser` from both storages, dispatches `LOGOUT`, pushes `/login`, and still rejects with the original error; a 500 leaves storage alone, dispatches nothing, and rejects. Run it in the `node:14` container and see it fail because the module doesn't exist
- [x] 6.2 Add `frontend/client/src/apis/sessionExpiry.js` and install it once in `src/index.js` with `mmdb`, `store.dispatch`, `history` and the window storages (design decision 4); verify 6.1 passes

## 7. Titles as text (spec: myflix-client-security, text from the API)

- [x] 7.1 Write `frontend/client/src/components/ShowPreview/index.test.js`, rendering `ShowPreview` with a mock store into a jsdom container: a title `Law &amp; Order` shows `Law & Order`; a title `<img src=x onerror="window.__xss = true">` leaves only the poster `<img>` in the container and `window.__xss` undefined. Run it and see the markup example fail
  - Note: GitHub `master` already renders the title as text, so on the branch the entity example failed and the markup example passed; run against the live `ShowPreview` (with `dangerouslySetInnerHTML`) the markup example failed and the entity example passed. The fix must pass both.
- [x] 7.2 Add `decodeEntities` in `frontend/client/src/utils/decodeEntities.js` and render the title as `{decodeEntities(show.title)}` instead of `dangerouslySetInnerHTML` (design decision 5); verify 7.1 and all myflix tests pass, and `grep -rn dangerouslySetInnerHTML frontend/client/src` finds nothing

## 8. myflix build and deploy, before the MMDb merge (design decisions 7 and 9)

- [x] 8.1 Run `docker compose build` in the myflix repo, then serve the image locally on port 7667 and verify the home page answers 200 and its JavaScript bundle references `https://mmdb.online/api/v2`. If the build fails on the Dependabot pins, apply the fallback in design decision 7, record it here, and build again
  - Note: the Dependabot pins build fine. A native build on the Mac fails because `node-sass` 4.14 has no arm64 binary and `node:14-buster-slim` cannot compile it; building as `linux/amd64` (the server is x86_64) downloads the prebuilt binary and succeeds, so rehearse with `DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose build`.
- [x] 8.2 Commit the myflix changes, push the branch, and have the owner open and merge the pull request on GitHub; verify through the GitHub API that it merged
- [ ] 8.3 On the server, back up `~/myflix` (`tar czf ~/myflix-backup-2026-10-23.tgz -C ~ myflix`), copy the merged `frontend/` and `docker-compose.yml`, and run `docker compose up -d --build`; verify in Brave that myflix.stream loads, a login works and the grid shows titles as text

## 9. MMDb pull request with its archive

- [x] 9.1 Run the whole MMDb suite; verify it passes and coverage is reported
- [ ] 9.2 Commit the MMDb changes, push the branch, and have the owner open the pull request; verify the `test` check passes
- [ ] 9.3 Archive the change on the branch as its last commit (sync `api-auth`, `plex-webhook` and `myflix-client-security` into main specs, move the change to `openspec/changes/archive/`), push, and verify the `test` check passes on that commit

## Workflow follow-up

These run after the owner merges the MMDb pull request, in this order (design decision 9):

- On the server, copy `~/MMDb/.env` to `~/MMDb/.env.bak-2026-10-23`, then replace `JWT_SECRET` and add `PLEX_WEBHOOK_SECRET` with fresh `openssl rand -hex 64` values in one command that prints neither (design decision 8).
- Deploy MMDb: `cd ~/MMDb && git pull --ff-only && docker compose restart web`.
- The owner reads `PLEX_WEBHOOK_SECRET` on the server and changes the Plex webhook URL to `https://mmdb.online/v1/webhooks/new?token=<value>`.
- Verify: an API request without a token gets a 401; in Brave, myflix.stream with the old stored login goes to the login page and a fresh login works; a webhook request without the token gets a 401; a request with the token (read on the server, not printed) and a non-matching account gets a 204.
- Next change: `escape-html-in-views` (MMDb's ERB views render titles, plots and names unescaped).
