# Tasks

## 0. Branch

- [x] 0.1 Create `api-owner-checks` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Movie edits need the movie in your collection

- [x] 1.1 Create `spec/api_owner_spec.rb`, looping over `v2` and `v3` like `spec/api_auth_spec.rb`, with users from `create_user`, a movie from `create_movie(owner)` and bearer tokens from `JwtAuth.token`. Write examples: another user's `PUT /api/<version>/movies/:id` gets a 403 and the movie's title is unchanged; the same request with no token gets a 401; the owner's `PUT` saves the new title. For v3 only, another user's `PATCH /api/v3/movies/:id` gets a 403. Run `bundle exec rspec spec/api_owner_spec.rb` and see the refusal examples fail because the edit goes through.
- [x] 1.2 Add `require_api_owner!(collection, id)` to the `helpers do` block in `app/helpers/session_helper.rb`, next to `require_owner!`, as in design.md (403 with a JSON `message`). Call `require_api_owner!(:movies, params[:id])` right after `authenticate!` in `put '/movies/:id'` in both API controllers and in v3's `patch '/movies/:id'`. Verify that 1.1 passes.

## 2. Adding episodes needs the show in your collection

- [x] 2.1 In `spec/api_owner_spec.rb`, for both versions, add examples: another user's `POST /add_episodes` for a show from `create_show(owner)` gets a 403 and the season's episode count is unchanged, both with a single `episode` and with an array; the owner's request adds the episode; and the MyFlix flow, a user's `POST /add_show` for a new show followed by `POST /add_episodes` for that show's season, succeeds. Run the file and see the refusal examples fail because the episodes are added.
- [x] 2.2 In both controllers' `post '/add_episodes'`, call `require_api_owner!(:shows, ...)` with the show id taken as design.md describes, before `Show.find`. In v3's route, change the response's `include: :episodes.order(tv_episode)` to `include: :episodes`, as v2 has it, so the route stops crashing after saving. Verify that 2.1 and 1.1 pass.

## 3. Verify

- [x] 3.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass, especially `spec/api_auth_spec.rb` and `spec/collection_access_spec.rb`.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `api-owner-checks`, archive the change in the same PR, and in the same archive commit widen `openspec/specs/collection-access/spec.md`'s Purpose from "from the web app" to the web app and the JSON APIs. Open the PR with `gh`; the owner merges.
- After the deploy, run the check in design.md's Migration Plan.
