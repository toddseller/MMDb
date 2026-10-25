# Tasks

Each code task is test-first: write the examples, run them and see them fail for the reason the task names, write the smallest code that passes, then run `bundle exec rspec`.

## 1. Branch

- [x] 1.1 Create the `guard-web-routes` branch from an up-to-date `master` and verify `git branch --show-current` names it

## 2. Helpers

- [x] 2.1 Add `require_sign_in!` and `require_owner!(collection = nil, id = nil)` next to `current_user` in `app/helpers/session_helper.rb`, and switch the artwork route to `require_owner!(:shows, params[:id])`; first change the two wrong-user examples in `spec/artwork_upload_spec.rb` (another user's URL, a show outside the collection) to expect 403 and see them fail with 401, then verify the whole file passes
- [x] 2.2 Make `current_user` use `User.find_by(id: session[:user_id])`; first add a spec that a session naming a deleted user gets 401 from a guarded route instead of a 500, and verify it fails before the change

## 3. Collection routes

- [x] 3.1 Add `spec/collection_access_spec.rb` with, for each of the 9 routes under `/users/:user_id` in design.md's table, a signed-out request, a request signed in as another user, and (for routes on an existing movie or show) the owner's id with a record outside their collection; signed out expects 401, the other two expect 403, and each leaves the record unchanged or saves nothing. Verify the examples fail on the current code (writes happen, 200s and 500s)
- [x] 3.2 Add the `require_owner!` line as the first line of each of those routes; verify the access spec passes and `show_edit_spec.rb`, `grid_responses_spec.rb`, `page_escaping_spec.rb` and `page_text_spec.rb` pass unchanged
- [x] 3.3 Delete `DELETE /users/:user_id/shows/:id`; first add an example that the route answers 404, and verify `grep -rn "shows/\${" public/js/mmdb` and the e2e suite show no caller

## 4. Shared routes and searches

- [x] 4.1 Extend the access spec for `PUT /movies/update/:id` (signed out: 401; signed in without the movie: 403), `POST /shows` and `POST /movies/:id/ratings` (signed out: 401), and `PUT /users/:id` (signed out: 401; signed in as another user: 403), plus a signed-in rating of another collection's movie that still saves; verify the refusal examples fail on the current code
- [x] 4.2 Add the guards from design.md's table to those 4 routes; verify the access spec, `account_spec.rb` and the full suite pass
- [x] 4.3 Extend the access spec for `GET /movies`, `GET /movies/update` and `GET /shows` (signed out: 401 and no Apple or TMDB request; signed in: 200), and `GET /movies/search` and a collection page signed out (200); verify the signed-out search examples fail on the current code
- [x] 4.4 Add `require_sign_in!` to the 3 search routes; verify the access spec and the full suite pass

## 5. Integration checks

- [x] 5.1 List every `post`, `put` and `delete` route in `app/controllers` outside the APIs, sessions, sign-up and webhooks with `grep -nE "^(post|put|delete) " app/controllers/*.rb`, and verify each one appears in the access spec
- [x] 5.2 Run `bundle exec rspec`, `npm run typecheck`, `npm test` and `npx playwright test`; verify all pass
- [x] 5.3 Run `/ponytail:ponytail-review` on the full diff and resolve its findings before the first commit

## Workflow follow-up

- Commit on the branch, archive the change in the same PR once the work is done, and open the PR with `gh`; the user merges it.
- After the release, run the signed-out `curl` checks from design.md's Migration Plan against production, then add and remove a movie and an episode signed in.
