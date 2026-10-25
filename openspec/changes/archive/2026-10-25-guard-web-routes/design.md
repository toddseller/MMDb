# Design

## Context

See proposal.md for why. The relevant code:

- Sign-in is `session[:user_id]`, read by `current_user` in `app/helpers/session_helper.rb` (a Sinatra `helpers do` block, so every route can call it). It uses `User.find`, which raises when the session names a user that no longer exists.
- One route already guards itself correctly, the artwork upload (`users_shows_controller.rb:100`): `halt 401 unless current_user && current_user.id == params[:user_id].to_i && current_user.shows.exists?(params[:id])`. Its spec (`show-artwork`) and tests answer 401 for signed out, wrong user and a show outside the collection.
- The other routes look up and write records first and use `current_user` afterwards, or never. Two never read the session: setting a default season (`users_seasons_controller.rb`) and deleting an episode (`users_episodes.rb:46`).
- Movie and show rows are shared between collections (`has_and_belongs_to_many :users`), so "is it in your collection" is a separate check from "is it your URL".
- The browser code sends every write through `request()` in `public/js/mmdb/request.js`, which throws on any non-2xx status; the edit forms and dialogs already show their failure line for that.
- Route specs that write (`show_edit_spec.rb`, `grid_responses_spec.rb`, `page_escaping_spec.rb`, `page_text_spec.rb`, `account_spec.rb`, `artwork_upload_spec.rb`) already sign in with `log_in`, and the e2e seed signs in before calling routes.

## Goals / Non-Goals

**Goals:**
- One guard per route, as its first line, before any lookup or write.
- The same answers everywhere, with nothing changed: 401 when nobody is signed in, 403 when someone is signed in but may not do this.

**Non-Goals:**
- No change to how a sign-in is carried; the JWT cookie change comes next and only replaces what `current_user` reads.
- No change to the shared-rows model: an owner editing a movie that is also in another collection still changes it for both.

## Decisions

### Two helpers next to `current_user`

```ruby
def require_sign_in!
  halt 401 unless current_user
end

# The URL's user must be the signed-in one; an existing movie or show must also be in their collection.
def require_owner!(collection = nil, id = nil)
  require_sign_in!
  halt 403 unless current_user.id == params[:user_id].to_i && (collection.nil? || current_user.public_send(collection).exists?(id))
end
```

Each route starts with one call, for example `require_owner!(:shows, params[:show_id])` or `require_owner!(:movies, params[:id])`; adding a movie or a season calls `require_owner!` with no record. The artwork route switches to `require_owner!(:shows, params[:id])` so there is one rule, and its tests keep it honest.

Alternative considered: a Sinatra `before '/users/:user_id/*'` filter. Rejected because the record id sits under different parameter names per route (`:id`, `:show_id`), the filter would also run for the public page GETs under the same prefix, and six routes outside `/users/:user_id` would still need their own guard.

### Route by route

| Route | Guard |
|---|---|
| `POST /users/:user_id/movies` | `require_owner!` |
| `PUT /users/:user_id/movies/:id` | `require_owner!(:movies, params[:id])` |
| `DELETE /users/:user_id/movies/:id` | `require_owner!(:movies, params[:id])` |
| `POST /users/:user_id/shows` | `require_owner!` |
| `PUT /users/:user_id/shows/:id` | `require_owner!(:shows, params[:id])` |
| `POST /users/:user_id/shows/:id/artwork` | `require_owner!(:shows, params[:id])` (replaces the inline check) |
| `POST /users/:user_id/shows/:show_id/seasons/:id` | `require_owner!(:shows, params[:show_id])` |
| `POST /users/:user_id/shows/:show_id/seasons/:season_id/episodes` | `require_owner!(:shows, params[:show_id])` |
| `DELETE /users/:user_id/shows/:show_id/seasons/:season_id/episodes/:id` | `require_owner!(:shows, params[:show_id])` |
| `PUT /movies/update/:id` | `require_sign_in!` plus `halt 403 unless current_user.movies.exists?(params[:id])` |
| `POST /shows` | `require_sign_in!` |
| `POST /movies/:id/ratings` | `require_sign_in!` |
| `PUT /users/:id` | `require_sign_in!` plus `halt 403 unless current_user.id == params[:id].to_i` (the user is `:id` here, not `:user_id`) |
| `GET /movies`, `GET /movies/update`, `GET /shows` | `require_sign_in!` |

`DELETE /users/:user_id/shows/:id` is deleted rather than guarded: nothing calls it, and its body removes a movie, so guarding it would keep a wrong route alive.

### `current_user` survives a deleted user

`User.find` becomes `User.find_by(id:)`, so a session naming a deleted user reads as signed out and the guard answers 401 instead of raising a 500.

### 401 for signed out, 403 for not allowed

401 means "I don't know who you are" (no sign-in, or one that is no longer valid); 403 means "I know you, and you can't do this". The browser treats both as a failure today, but the sign-in tokens change that follows will let sessions expire, and a 401 is how a page can tell "sign in again" from "not yours" without asking the server why. The artwork route switches from 401 to 403 for a wrong user or show, through `require_owner!`; `show-artwork` gets a MODIFIED delta and two lines of `spec/artwork_upload_spec.rb` change to expect 403.

Alternative considered: 404 for records outside the collection, to hide whether they exist. Rejected because collections are public pages, so nothing is hidden. Every existing caller already handles `nil` (the pages show signed out).

## Risks / Trade-offs

- [An owner whose session ended mid-edit now gets a refusal instead of a half-applied write and a 500] → the edit forms already show "couldn't be saved" for any failed request; the user signs in again.
- [A route missed in the table stays open] → the access spec lists every non-GET web route outside sign-up and sign-in and checks each signed out; a new route added later without a guard won't be in the list, so the check is only as good as the list. The task list includes a grep for `^(post|put|delete) ` in `app/controllers` (excluding the APIs, sessions and webhooks) to compare against it.
- [Rack's origin check is the only CSRF protection for signed-in writes] → unchanged by this change, and covered by `SameSite=Lax` in the JWT cookie change.

## Migration Plan

1. Deploy by release tag as usual; no data or settings change.
2. After the release, from a machine that is not signed in: `curl -s -o /dev/null -w '%{http_code}' -X PUT https://mmdb.online/users/1/movies/996 -d 'movie[plot]=x'` answers 401, and `GET /movies?query=rocky` answers 401. Then, signed in, add and remove a movie and an episode from the app.
3. Rollback: the previous tag.
