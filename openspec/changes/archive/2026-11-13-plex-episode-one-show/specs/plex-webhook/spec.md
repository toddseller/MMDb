# Spec Delta

## ADDED Requirements

### Requirement: A single-episode import goes into at most one show
When Plex reports one episode, the import SHALL add it to at most one show, even when several shows share the reported title and season number. When more than one show is still a candidate after the rules below, the import SHALL add nothing, SHALL NOT create a show, and SHALL log the title, season and episode.

#### Scenario: Two candidates left
- **WHEN** Plex reports an episode with no IDs, no candidate show is stored, and two shows titled "The Lowdown" both have the reported season
- **THEN** no show, season or episode is created, and the log names the title, season and episode

### Requirement: A single-episode import picks its show by the episode's IDs
When Plex reports one episode with an IMDb or TVDB ID that TMDB can place, the import SHALL consider only the show TMDB places it in: a TMDB candidate whose show ID equals that show's ID, or an Apple or stored candidate whose year is within one year of that show's first air date. The database, then Apple, then TMDB priority of the show search SHALL still apply.

#### Scenario: Namesake that is not stored
- **WHEN** "The Lowdown" (2025) is stored, and Plex reports a season 1 episode whose IDs TMDB places in the 2025 show, while TMDB also lists a 1988 "The Lowdown" with a season 1
- **THEN** the episode is added to the 2025 show, and no 1988 show is created

#### Scenario: Two stored namesakes
- **WHEN** both "The Office" (2001) and "The Office" (2005) are stored with a season 2, and Plex reports a season 2 episode whose IDs TMDB places in the 2005 show
- **THEN** the episode is added to the 2005 show only

#### Scenario: Show on both Apple and TMDB
- **WHEN** no candidate show is stored, Apple and TMDB both list the show TMDB places the episode in, and no namesake is left
- **THEN** the show, season and episode are created from Apple

### Requirement: A single-episode import without usable IDs prefers a stored show
When Plex reports one episode without an IMDb or TVDB ID, when TMDB can't place it, or when no candidate matches the show TMDB places it in, the import SHALL consider only candidates that belong to a show already stored, counting a season not yet stored. When no candidate belongs to a stored show, every candidate SHALL remain.

#### Scenario: New season of a stored show
- **WHEN** "The Lowdown" (2025) is stored with season 1 only, TMDB also lists a 1988 "The Lowdown" with a season 2, and Plex reports a season 2 episode without IDs
- **THEN** season 2 is added to the 2025 show with the episode, and no 1988 show is created

#### Scenario: TMDB can't be reached
- **WHEN** Plex reports an episode with IDs, the TMDB lookup fails, and exactly one candidate belongs to a stored show
- **THEN** the episode is added to that stored show and the webhook still answers 204

#### Scenario: TMDB places the episode but gives no year
- **WHEN** Plex reports an episode whose IDs TMDB places in a show, TMDB then refuses the request for that show's first air date, and exactly one candidate belongs to a stored show
- **THEN** the episode is added to that stored show

#### Scenario: Only one candidate, nothing stored
- **WHEN** Plex reports an episode without IDs and exactly one show matches the title and season, and it isn't stored
- **THEN** the show, season and episode are created as before

### Requirement: A show-level import matches the show's year within one year
When Plex reports a whole show, the import SHALL use only candidates whose title and season match and whose year is within one year of the year Plex reports. No title SHALL have its year replaced by a fixed value.

#### Scenario: Plex dates the show a year later
- **WHEN** Plex reports the show "Matlock" with year 2025, and the search lists Matlock (2024) and Matlock (1986) with the reported season
- **THEN** the season is imported from Matlock (2024) only

#### Scenario: Namesake decades apart
- **WHEN** Plex reports the show "Matlock" with year 1986, and the search lists Matlock (2024) and Matlock (1986) with the reported season
- **THEN** the season is imported from Matlock (1986) only
