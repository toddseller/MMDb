# Proposal

## Why

Most of the web app's routes that change data never check who is asking. On 2026-10-25, in the test database, a `PUT /users/<id>/movies/<id>` with no session rewrote a movie's plot, and a `POST /users/<id>/shows` with no session saved a new show; both answered 500 only after writing. Setting a show's default season and deleting an episode don't look at the session at all. Anyone who can reach mmdb.online, with a script rather than a browser, can rewrite or delete any collection's data. The three outside searches have the same gap: each sends 25 to 45 requests to Apple and TMDB for anyone who asks.

## What Changes

- Refusals tell the two cases apart: 401 when nobody is signed in (or the sign-in is no longer valid), 403 when someone is signed in but may not do this. Either way nothing changes. The sign-in tokens change that follows relies on 401 meaning "sign in again".
- Every web route that changes a collection is refused unless the signed-in user is the user in the URL and, for an existing movie or show, has it in their collection: adding, editing and removing movies; adding, editing and removing shows' seasons and episodes; setting a show's default season.
- Routes without a user in the URL are refused unless someone is signed in: refreshing a movie from the edit form's search (which also needs the movie in the user's collection), Create New Show, rating a movie, and saving Account Settings (which also needs the URL's user to be the signed-in one).
- The Add Movie, edit form and Add TV Show searches answer 401 when nobody is signed in, without asking the database, Apple or TMDB.
- **BREAKING** (unused route): `DELETE /users/:user_id/shows/:id` is removed. Nothing in the app calls it, and it removes the *movie* with that id from the user's collection.
- Sign-up, sign-in, every page, and the person filter (`GET /movies/search`) stay open.

Out of scope: how a sign-in is carried (the JWT cookie change that follows this one); `params[:movie]` being passed whole to `update`, which after this change only reaches the user's own movies.

## Capabilities

### New Capabilities
- `collection-access`: who may change a collection's movies, shows, seasons, episodes, ratings and account settings, and who may run the outside searches, from the web app.

### Modified Capabilities

- `show-artwork`: an upload by a signed-in user who isn't the show's owner is refused with 403 instead of 401; signed out stays 401.

## Impact

- `app/controllers/`: `users_movies_controller.rb`, `users_shows_controller.rb`, `users_seasons_controller.rb`, `users_episodes.rb`, `movies_controller.rb`, `shows_controller.rb`, `ratings_controller.rb`, `users_controller.rb`.
- `spec/`: a new access spec covering each route signed out, signed in as someone else, and as the owner; existing route specs already sign in.
- The web pages already show their failure state for a refused request, so an owner whose session ended sees that instead of a server error.
- No API (`/api/v2`, `/api/v3`) changes; they already require a token.
