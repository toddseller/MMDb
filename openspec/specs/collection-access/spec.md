# collection-access Specification

## Purpose
Defines who may change a collection from the web app (its movies, shows, seasons, episodes and ratings, and the account behind it) and who may run the searches that query Apple and TMDB, so that only a collection's owner can change it.

## Requirements

### Requirement: Only the owner changes a collection
A web request that adds, edits or removes a movie, a show's season or an episode, or sets a show's default season, SHALL change nothing unless the signed-in user is the user in the URL and, when it acts on an existing movie or show, has it in their collection. It SHALL answer 401 when nobody is signed in, and 403 when someone is signed in but fails either check. The owner's requests SHALL behave as before.

#### Scenario: Signed out
- **WHEN** a request with no signed-in user edits a movie in user 1's collection
- **THEN** the response is 401 and the movie is unchanged

#### Scenario: Someone else's collection
- **WHEN** user 2, signed in, deletes an episode from a show in user 1's collection
- **THEN** the response is 403 and the episode still exists

#### Scenario: A show not in the collection
- **WHEN** user 1, signed in, sets the default season of a show that is not in their collection, using their own user id in the URL
- **THEN** the response is 403 and the show's seasons are unchanged

#### Scenario: Adding while signed out
- **WHEN** a request with no signed-in user adds a show's season to user 1's collection
- **THEN** the response is 401 and no show or season is saved

#### Scenario: The owner
- **WHEN** user 1, signed in, edits a movie in their collection
- **THEN** the movie is saved as before

### Requirement: Shared writes need a signed-in user
Creating a new show, rating a movie, refreshing a movie from the edit form's search and saving Account Settings SHALL answer 401 and change nothing when nobody is signed in. Refreshing a movie SHALL answer 403 and change nothing unless the movie is in the signed-in user's collection, and saving Account Settings SHALL answer 403 and change nothing unless the signed-in user is the user in the URL.

#### Scenario: Rating while signed out
- **WHEN** a request with no signed-in user rates a movie 4 stars
- **THEN** the response is 401 and no rating is saved

#### Scenario: Refreshing another collection's movie
- **WHEN** user 2, signed in, refreshes a movie that is only in user 1's collection
- **THEN** the response is 403 and the movie is unchanged

#### Scenario: Someone else's account
- **WHEN** user 2, signed in, saves Account Settings for user 1's URL
- **THEN** the response is 403 and user 1's account is unchanged

#### Scenario: Signed-in rating
- **WHEN** a signed-in user rates a movie in another user's collection
- **THEN** the rating is saved as before

### Requirement: Outside searches need a signed-in user
The Add Movie search, the edit form's search and the Add TV Show search SHALL answer 401 when nobody is signed in, without querying the database, Apple or TMDB. A signed-in user SHALL get results as before. The person filter SHALL stay open to everyone.

#### Scenario: Signed-out search
- **WHEN** a request with no signed-in user searches Add Movie for `rocky`
- **THEN** the response is 401 and no request goes to Apple or TMDB

#### Scenario: Signed-in search
- **WHEN** a signed-in user searches Add TV Show for `lupin`
- **THEN** the response is 200 with the results

#### Scenario: Person filter for a visitor
- **WHEN** a visitor who is not signed in filters a collection by a person's name
- **THEN** the response is 200 with the filtered list and the person's image

### Requirement: Reading stays open
Sign-up, sign-in and every page that shows a collection SHALL keep working for visitors who are not signed in.

#### Scenario: Visitor views a collection
- **WHEN** a visitor who is not signed in opens user 1's movies page
- **THEN** the page shows user 1's movies
