# Proposal

## Why

The web app only lets a user change movies and shows in their own collection, but the JSON APIs check only that the token is valid. Signup is open (including through `/api/v3/signup`, which mmdb.online serves publicly), so anyone can get a token and then rewrite any movie through `PUT /api/v2/movies/:id` or add episodes to any show through `POST /api/v2/add_episodes`. Every movie and show row is shared by all the users who have it, so one edit changes everyone's collection.

## What Changes

- `PUT /movies/:id` in `/api/v2` and `/api/v3`, and `PATCH /movies/:id` in `/api/v3`, answer 403 and change nothing unless the movie is in the token's user's collection.
- `POST /add_episodes` in `/api/v2` and `/api/v3` answers 403 and adds nothing unless the show is in the token's user's collection.
- `POST /api/v3/add_episodes` stops answering every call with a 500. It saved the episodes and then crashed building its response (`:episodes.order(tv_episode)`); it now builds the response the way v2 does.
- Every endpoint stays: MyFlix uses `/api/v2`, `/api/v3` may return with the iOS app, and MyFlix is about to be refactored. Reads, `add_movie`, `add_show`, signup and login are unchanged. MyFlix's real flow (`add_show`, then `add_episodes` for the show it just added) keeps working.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `collection-access`: the "only the owner changes a collection" rule extends from the web app to the JSON APIs.

## Impact

- `app/controllers/api_v2_controller.rb`, `app/controllers/api_v3_controller.rb`, and one helper next to `require_owner!` in `app/helpers/session_helper.rb`.
- No change for MyFlix as it is used today; a client calling these routes for someone else's movie or show gets a 403.
- Known limit, unchanged: anyone can add a movie or show to their collection and then edit it, as in the web app. Closing that needs per-owner copies of shared rows, which is out of scope.
- Left as is: v3's `PATCH /movies/:id` returns the new values without saving them; v3 is unused for now.
