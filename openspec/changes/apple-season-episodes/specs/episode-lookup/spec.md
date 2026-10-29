## ADDED Requirements

### Requirement: Apple lookups follow Apple's current season layout
When a stored Apple season's episodes are fetched, for adding by hand, through the APIs or from the Plex webhook, the lookup SHALL find where that season starts and how many episodes it has from Apple's current season list, matching the season by its number, and SHALL list only episodes Apple labels with that season number. The stored start and count SHALL be used only when Apple's season list can't be read.

#### Scenario: An earlier season gained an episode
- **WHEN** Apple has added an episode to season 1 since season 2 was stored, so season 2 now starts one episode later than stored
- **THEN** picking season 2 lists exactly season 2's episodes, including its last one

#### Scenario: Plex reports an episode of a shifted season
- **WHEN** Plex reports episode 2 of such a season 2
- **THEN** season 2's episode 2 is fetched and imported

#### Scenario: Another season's episode in the window
- **WHEN** the episodes Apple returns for a season's window include one from another season
- **THEN** that episode is not listed

#### Scenario: Season list unavailable
- **WHEN** Apple's season list can't be read
- **THEN** the lookup uses the stored start and count, as before
