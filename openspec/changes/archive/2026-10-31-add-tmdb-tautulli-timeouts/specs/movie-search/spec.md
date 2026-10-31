# Spec Delta

## ADDED Requirements

### Requirement: A slow TMDB answer doesn't hold up a movie search
Every request to TMDB SHALL give up after 5 seconds. A request that gives up SHALL be treated as a failed one: the search still returns the database and Apple entries, and a movie whose details request gives up is left out.

#### Scenario: TMDB search doesn't answer
- **WHEN** TMDB doesn't answer the movie search request within 5 seconds
- **THEN** the search returns the database and Apple entries, with no TMDB entries

#### Scenario: One TMDB movie doesn't answer
- **WHEN** TMDB's search returns two movies with posters and the details request for one of them doesn't answer within 5 seconds
- **THEN** the result contains the other TMDB movie and not the one that timed out
