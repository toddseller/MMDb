# library-counts Specification

## Purpose
Reports how many movies, shows and episodes the Plex library holds, read from Tautulli, for pages such as toddseller.com that show those counts.

## Requirements

### Requirement: The count endpoint reports the Plex library counts
`/api/movies/count` SHALL answer with JSON holding `movies`, `shows` and `episodes`, read from Tautulli's library list: the first library's count as movies, the second library's count as shows, and the second library's child count as episodes.

#### Scenario: Tautulli answers
- **WHEN** Tautulli lists a movie library of 1200 items and a show library of 300 shows with 9000 episodes
- **THEN** `/api/movies/count` answers `{"movies":1200,"shows":300,"episodes":9000}`

### Requirement: A slow Tautulli answer doesn't hold up the count endpoint
The request to Tautulli SHALL give up after 5 seconds. When it gives up, `/api/movies/count` SHALL answer with a server error, the same as when Tautulli can't be reached.

#### Scenario: Tautulli doesn't answer
- **WHEN** Tautulli doesn't answer the library-list request within 5 seconds
- **THEN** `/api/movies/count` answers with status 500 instead of waiting for Tautulli
