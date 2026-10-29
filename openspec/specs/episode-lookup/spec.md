# episode-lookup Specification

## Purpose

Defines how the episodes of a stored season are fetched from the source it came from, for adding episodes by hand, through the APIs, and from the Plex webhook.

## Requirements

### Requirement: Apple lookups without a stored storefront use the US store
When a season's episodes are fetched from Apple and the season has no stored storefront (nil or blank), the lookup SHALL use the US storefront (`143441`). A season with a stored storefront SHALL keep using it.

#### Scenario: Season added before storefronts were stored
- **WHEN** an Apple season with skip 0, count 11 and no storefront is opened to add episodes
- **THEN** its 11 episodes are fetched from the US storefront and listed

#### Scenario: Plex reports an episode of such a season
- **WHEN** Plex reports a new episode of an Apple season that has no storefront
- **THEN** the episode is fetched from the US storefront and imported

#### Scenario: Stored storefront kept
- **WHEN** an Apple season stored with the UK storefront (`143444`) is opened to add episodes
- **THEN** its episodes are fetched from the UK storefront

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
