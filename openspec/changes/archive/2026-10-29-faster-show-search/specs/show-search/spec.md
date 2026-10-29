## ADDED Requirements

### Requirement: Stored seasons are refreshed once per show
When a search refreshes the episode counts of stored Apple seasons, it SHALL fetch each stored show's Apple season list once per storefront, however many of that show's seasons are stored, and SHALL take every stored season's count from it.

#### Scenario: A long-running show
- **WHEN** a search matches a show with 29 stored Apple seasons
- **THEN** the search makes one Apple season-list request for that show, and each stored season shows Apple's current count

### Requirement: A slow Apple answer doesn't hold up a search
Every request to Apple SHALL give up after 5 seconds. A request that gives up SHALL be treated as a failed one: stored seasons keep their stored counts, and the search still returns the stored and TMDB seasons.

#### Scenario: Apple doesn't answer
- **WHEN** Apple doesn't answer the season-list request for a stored show within 5 seconds
- **THEN** the search returns that show's stored seasons with their stored counts, along with the other results
