## ADDED Requirements

### Requirement: A show-level import adds only aired episodes
When Plex reports a whole show rather than one episode, the import SHALL add only those episodes of the fetched season whose air date is today or earlier. An episode with no air date SHALL NOT be added. This applies to seasons from both TMDB and Apple.

#### Scenario: Season with aired, upcoming and undated episodes
- **WHEN** Plex reports a show whose latest season has episodes 1 and 2 aired before today, episode 3 airing today, episode 4 airing next week and episode 5 with no air date
- **THEN** episodes 1, 2 and 3 are added and episodes 4 and 5 are not

#### Scenario: TMDB season
- **WHEN** Plex reports a show whose latest season comes from TMDB and lists one aired and one upcoming episode
- **THEN** only the aired episode is added

### Requirement: A single-episode import ignores the air date
When Plex reports one episode, the import SHALL add that episode whatever its air date, because Plex already has its file.

#### Scenario: Episode dated in the future
- **WHEN** Plex reports an episode whose source lists an air date of tomorrow
- **THEN** the episode is added

### Requirement: An import refreshes an episode already stored
When a Plex import, show-level or single-episode, includes an episode the season already has, the stored episode's title, air date, plot, runtime and still SHALL be replaced with the fetched values, including values edited by hand.

#### Scenario: Placeholder replaced by a single-episode import
- **WHEN** a season stores episode 6 as "Episode 6" with no plot, and Plex reports episode 6, whose source now lists a title and plot
- **THEN** the stored episode 6 has the fetched title and plot, and the season still has one episode 6

#### Scenario: Placeholder replaced by a show-level import
- **WHEN** a season stores episode 2 as "Episode 2" with no plot, and Plex reports the show after episode 2 has aired
- **THEN** the stored episode 2 has the fetched title and plot

#### Scenario: Hand edit overwritten
- **WHEN** a stored episode's title was changed by hand, and Plex reports that episode again
- **THEN** the stored title is the source's title
