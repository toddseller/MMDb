# Spec Delta

## MODIFIED Requirements

### Requirement: Each show gets one card
TV additions SHALL be grouped into one card per show, whether Plex reports the show itself, its seasons or its episodes. The card's label SHALL be a single phrase: "New series" when the show itself was added, otherwise "New season" when a whole season was added, otherwise the number of episodes added, for example "8 episodes" or "1 episode".

#### Scenario: Several episodes of one show
- **WHEN** eight episodes of Tulsa King were added this week
- **THEN** the issue has one Tulsa King card that says "8 episodes"

#### Scenario: A whole season
- **WHEN** Plex reports Season 3 of The Rings of Power as one added item
- **THEN** the issue has one card for The Rings of Power that says "New season"

#### Scenario: A new show
- **WHEN** Plex reports MythBusters itself as added
- **THEN** the issue has one MythBusters card that says "New series"

#### Scenario: A whole season and some episodes
- **WHEN** Season 2 of Dexter was added whole and two episodes of Season 3 were added too
- **THEN** the issue has one Dexter card that says "New season"

### Requirement: Cards link into Plex
Each card SHALL link to its title in Plex's web app on this Plex server, so a reader can open it with one click. A movie card SHALL link to the movie. A show card SHALL link to the show when the show itself was added, otherwise to the season added whole, otherwise to the season of the newest added episode.

#### Scenario: Opening a show
- **WHEN** a reader clicks the Tulsa King card for two new Season 3 episodes
- **THEN** Plex's web app opens Tulsa King's Season 3 page on the server

#### Scenario: Opening a new season
- **WHEN** a reader clicks The Rings of Power card for a Season 3 added whole
- **THEN** Plex's web app opens that Season 3 page

#### Scenario: Opening a new series
- **WHEN** a reader clicks the MythBusters card for a show added whole
- **THEN** Plex's web app opens MythBusters' show page
