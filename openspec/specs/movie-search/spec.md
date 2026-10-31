# movie-search Specification

## Purpose
Defines how a title search builds the list of movies a user can add, and the list the edit form offers to refresh a movie from: what the database, Apple TV and TMDB each contribute, when two entries are the same movie, which source wins, and how the outside requests are scheduled.

## Requirements

### Requirement: Sources merge with database, then Apple, then TMDB priority
A search SHALL return the first 10 database movies whose title contains the term, followed by the Apple and TMDB movies that are not the same movie as an entry already kept, with the same fields as before this change. The database SHALL win over Apple and Apple over TMDB, whichever source answers first. The result SHALL be sorted by year, keeping that priority order within a year.

#### Scenario: Stored movie wins
- **WHEN** the database has "Rocky" (1976) and Apple and TMDB both return "Rocky" (1976)
- **THEN** the result has one "Rocky" (1976) entry, the stored one

#### Scenario: Apple wins over TMDB
- **WHEN** Apple and TMDB both return "Rocky" (1976) and the database has none
- **THEN** the result has one "Rocky" (1976) entry, and it carries Apple's poster

#### Scenario: Priority holds when TMDB answers first
- **WHEN** the TMDB responses arrive before the Apple responses
- **THEN** the result is the same as when Apple answers first

### Requirement: The same movie means the same title, nearly the same year and no conflicting director
Two entries SHALL count as the same movie only when their titles match ignoring case and treating curly single quotes (’ and ‘) as a straight apostrophe, their years are at most one apart, and their directors don't conflict. Directors don't conflict when either is blank or their last names match, where the last name is the final word of the director text with every kind of whitespace, including non-breaking spaces, ignored.

#### Scenario: Stored director with a non-breaking space
- **WHEN** the database has "Rocky" (1976) directed by "John G. Avildsen" followed by a non-breaking space, and Apple returns "Rocky" (1976) directed by "John G. Avildsen"
- **THEN** the result has one "Rocky" (1976) entry, the stored one

#### Scenario: Apple and TMDB a year apart are one movie
- **WHEN** Apple returns "Rocky" (1976) and TMDB returns "Rocky" (1977), both directed by "John G. Avildsen"
- **THEN** the result has one "Rocky" entry, from Apple

#### Scenario: Same title and year by different directors are both kept
- **WHEN** TMDB returns "Rocky" (2008) directed by "Martin Kellerman" and "Rocky" (2008) directed by "S. K. Nagendra Urs"
- **THEN** both appear in the result

#### Scenario: A blank director matches any director
- **WHEN** Apple returns "Rocky" (1976) with no director and TMDB returns "Rocky" (1976) directed by "John G. Avildsen"
- **THEN** the result has one "Rocky" (1976) entry, from Apple

#### Scenario: One director's films from the same year are both kept
- **WHEN** TMDB returns two movies with different titles, released the same year by the same director
- **THEN** both appear in the result

#### Scenario: A remake years later is a different movie
- **WHEN** TMDB returns "Rocky" (1948) and "Rocky" (1976)
- **THEN** both appear in the result

### Requirement: Apple matches partial titles, ranked and capped
Apple TV SHALL contribute movies whose title contains the search term, ignoring case. It SHALL fetch at most 20 movies per search, ranked with exact title matches first, then titles starting with the term, then titles containing it, keeping Apple's order within each rank. Results that are not movies, or whose title does not contain the term, SHALL be ignored.

#### Scenario: Partial title
- **WHEN** the user searches `rocky` and Apple's search returns the movies "Rocky", "Rocky II" and "Creed", and the show "Rocky Road"
- **THEN** the result includes "Rocky" and "Rocky II" from Apple, and nothing from "Creed" or the show

#### Scenario: Cap keeps the exact match
- **WHEN** Apple returns 25 movies containing `rocky`, with "Rocky" listed last
- **THEN** Apple details are fetched for 20 movies, and "Rocky" is one of them

### Requirement: Each Apple movie is fetched once
The system SHALL search the US, UK, CA and AU Apple storefronts and SHALL fetch each unique Apple movie's details once, from the first storefront in that order whose search returned it.

#### Scenario: Movie in several storefronts
- **WHEN** all four storefronts return the same movie
- **THEN** its details are requested once, from the US storefront

#### Scenario: Movie only outside the US
- **WHEN** only the UK storefront returns a movie
- **THEN** its details are fetched from the UK storefront

### Requirement: TMDB contributes first-page results that have a poster
TMDB SHALL contribute every movie on the first page of its search results that has a poster and whose details request succeeds, without a cap or title filter. Each movie's details, credits and US release rating SHALL be fetched in one request.

#### Scenario: Request count
- **WHEN** TMDB's search returns 20 movies
- **THEN** the search makes 21 TMDB requests: 1 search and 1 per movie

#### Scenario: Movie without a poster
- **WHEN** a TMDB search result has no poster
- **THEN** it is not in the result

### Requirement: Outside lookups run concurrently
The Apple lookup and the TMDB lookup SHALL run at the same time, and each SHALL run its own requests several at a time, so a search takes about as long as its slowest chain of dependent requests rather than the sum of all of them. A failing or unreachable source SHALL leave the other sources' entries in the result.

#### Scenario: Slow responses overlap
- **WHEN** every outside response takes 0.5 seconds, the 4 Apple storefronts return 2 movies and TMDB returns 5
- **THEN** the search finishes in under 1.6 seconds, where running the 12 requests one after another takes 6

#### Scenario: One source fails
- **WHEN** Apple answers every request with an error
- **THEN** the result still contains the database and TMDB entries

### Requirement: Apple credits are stored without surrounding whitespace
Names in an Apple movie's actors, director, producer and writer SHALL have leading and trailing whitespace of every kind removed, including non-breaking spaces, before they are returned.

#### Scenario: Director with a trailing non-breaking space
- **WHEN** Apple lists the director as "John G. Avildsen" followed by a non-breaking space
- **THEN** the entry's director is "John G. Avildsen"

### Requirement: The edit form's search uses the outside sources only
The edit form's search SHALL return the Apple and TMDB movies for the stored title, with the same matching, priority, scheduling and sorting as the add search but no database movies. When neither source finds anything, it SHALL return an empty list.

#### Scenario: Stored movie is offered from the outside sources
- **WHEN** the edit form searches for "Rocky", which is in the database, and Apple and TMDB both return "Rocky" (1976)
- **THEN** the result has one "Rocky" (1976) entry, from Apple

#### Scenario: Nothing found
- **WHEN** Apple and TMDB return no movies for the stored title
- **THEN** the result is an empty list, and the edit form's search responds without an error

### Requirement: Existing callers keep working
The search page, the edit form, the Plex webhook import and the v2 and v3 search endpoints SHALL receive results in the same shape as before, so their behavior changes only in which movies are found.

#### Scenario: Webhook import
- **WHEN** Plex reports a new movie that Apple returns under its exact title and year, alongside other movies containing that title
- **THEN** the webhook imports only the movie with that exact title and year, as before

### Requirement: A slow TMDB answer doesn't hold up a movie search
Every request to TMDB SHALL give up after 5 seconds. A request that gives up SHALL be treated as a failed one: the search still returns the database and Apple entries, and a movie whose details request gives up is left out.

#### Scenario: TMDB search doesn't answer
- **WHEN** TMDB doesn't answer the movie search request within 5 seconds
- **THEN** the search returns the database and Apple entries, with no TMDB entries

#### Scenario: One TMDB movie doesn't answer
- **WHEN** TMDB's search returns two movies with posters and the details request for one of them doesn't answer within 5 seconds
- **THEN** the result contains the other TMDB movie and not the one that timed out
