# Spec Delta

## ADDED Requirements

### Requirement: A slow TMDB answer doesn't hold up a show search
Every request to TMDB SHALL give up after 5 seconds. A request that gives up SHALL be treated as a failed one: the search still returns the stored and Apple seasons, and a TMDB show whose details request gives up is left out.

#### Scenario: TMDB search doesn't answer
- **WHEN** TMDB doesn't answer the TV search request within 5 seconds
- **THEN** the search returns the stored and Apple seasons, with no TMDB seasons

#### Scenario: One TMDB show doesn't answer
- **WHEN** TMDB's TV search returns two shows and the details request for one of them doesn't answer within 5 seconds
- **THEN** the result contains the other show's seasons and none from the one that timed out
