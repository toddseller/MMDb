# Design

## Context

- `/api/v2` and `/api/v3` are near-copies. Each namespace defines its own `authenticate!`, which decodes the bearer token into `@auth_payload` (the user id is `sub`) or halts with a 401 and a JSON `message`.
- The web app's owner rule is `require_owner!` in `app/helpers/session_helper.rb`: the user must match the URL and, for an existing record, `current_user.public_send(collection).exists?(id)`.
- The four writes this change guards:
  - `PUT /movies/:id` (v2, v3) runs `movie.update(params[:movie])`.
  - `PATCH /movies/:id` (v3) assigns fields from params but never saves.
  - `POST /add_episodes` (v2, v3) takes the show from `params[:episode]['show_id']`, or from the first element when `params[:episode]` is an array, and adds every episode to that show's season.
- MyFlix (`myflix/frontend/client/src/actions/`) calls `PUT /movies/:id` nowhere, and calls `add_episodes` only after `add_show`, which puts the show in the user's collection.

## Goals / Non-Goals

**Goals:**
- The rule in specs/collection-access applies to the four API writes, in both versions.

**Non-Goals:**
- Removing or merging endpoints, or merging the two controllers.
- Stopping `add_show` from updating an existing season's `count` and `storeId`; the web route does the same.
- Making v3's `PATCH` save.
- Per-owner copies of shared movies and shows (the add-then-edit limit in proposal.md).

## Decisions

**One helper, `require_api_owner!(collection, id)`, in the existing `helpers do` block in `app/helpers/session_helper.rb`, next to `require_owner!`.** It halts with 403 unless `User.find(@auth_payload['sub']).public_send(collection).exists?(id)`. Both namespaces' routes can call a top-level helper, so the rule is written once, and each guarded route gets one line after `authenticate!`. The 403 carries a JSON `message`, like the API's 401s, so a client can show it. Rejected: a copy per namespace next to each `authenticate!` (the duplication this codebase already suffers from); a `before` filter per path (four paths across two namespaces, and `add_episodes` needs the id from the body).

**`add_episodes` checks the show it is about to write to:** `params[:episode]['show_id']`, or the first element's when the body is an array, which is the show every episode in the request goes to. The check goes before `Show.find`, so an unknown id is a 403 rather than a 404.

**Movies are checked by `params[:id]` before `Movie.find`.** An id that doesn't exist is then a 403, not a 500, and the route can't be used to probe which ids exist.

**Tests** go in a new `spec/api_owner_spec.rb`, built like `spec/api_auth_spec.rb`: a loop over `v2` and `v3`, users from `create_user`, records from `create_movie` and `create_show`, and a token from `JwtAuth.token`. Each guarded route gets a refused example (403, record unchanged) and an owner example (success, change saved), plus the `add_show`-then-`add_episodes` flow MyFlix uses.

## Risks / Trade-offs

- [A MyFlix flow edits or extends a movie or show it hasn't added] → Checked in its source: it never calls `PUT /movies/:id`, and calls `add_episodes` only after `add_show` for the same show. The owner flow test covers that sequence.
- [An old token names a user who has since been deleted] → `User.find` raises, as every authenticated API route already does today; unchanged.

## Migration Plan

Code-only: `bin/deploy` restarts the web container. After the deploy, with a token for an account that doesn't have a given movie, `PUT https://mmdb.online/api/v2/movies/<id>` answers 403, and MyFlix still adds a show and its episodes.
