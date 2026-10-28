# Spec Delta

## ADDED Requirements

### Requirement: Only the owner changes a collection through the API
An `/api/v2` or `/api/v3` request that edits a movie (`PUT /movies/:id`, and `PATCH /movies/:id` in v3) or adds episodes to a show (`POST /add_episodes`) SHALL change nothing and answer 403 unless the movie or show is in the collection of the user the token names. A request without a valid token SHALL still answer 401. The owner's requests SHALL behave as before.

#### Scenario: Editing a movie in someone else's collection
- **WHEN** user 2, with a valid token, sends `PUT /api/v2/movies/:id` for a movie that is only in user 1's collection
- **THEN** the response is 403 and the movie is unchanged

#### Scenario: Adding episodes to someone else's show
- **WHEN** user 2, with a valid token, sends `POST /api/v3/add_episodes` for a show that is only in user 1's collection
- **THEN** the response is 403 and no episode is added

#### Scenario: Without a token
- **WHEN** a request without a token sends `PUT /api/v3/movies/:id`
- **THEN** the response is 401 and the movie is unchanged

#### Scenario: The owner
- **WHEN** user 1, with a valid token, edits a movie in their collection
- **THEN** the movie is saved as before

#### Scenario: Adding a show, then its episodes
- **WHEN** a user adds a show with `POST /add_show` and then adds its episodes with `POST /add_episodes`
- **THEN** both succeed, because the show is now in their collection
