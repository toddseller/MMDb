# Spec Delta

## MODIFIED Requirements

### Requirement: Season label is unchanged
Each tile SHALL show the same season label as before this change, derived from the show's seasons in season order. A season 0 (specials) SHALL be left out of the label, and a show whose only season is 0 SHALL read "Specials".

#### Scenario: Single season
- **WHEN** a show has one season, numbered 2
- **THEN** the tile reads "Season 2"

#### Scenario: Two to four seasons
- **WHEN** a show has seasons 1 and 3
- **THEN** the tile reads "Seasons 1, 3"

#### Scenario: Three consecutive seasons
- **WHEN** a show has seasons 1, 2 and 3
- **THEN** the tile reads "Seasons 1–3"

#### Scenario: Five or more seasons
- **WHEN** a show has 7 seasons
- **THEN** the tile reads "7 seasons"

#### Scenario: Specials left out
- **WHEN** a show has seasons 1 to 14 and a season 0
- **THEN** the tile reads "14 seasons"

#### Scenario: Specials beside one season
- **WHEN** a show has season 3 and a season 0
- **THEN** the tile reads "Season 3"

#### Scenario: Only specials
- **WHEN** a show's only season is 0
- **THEN** the tile reads "Specials"

## ADDED Requirements

### Requirement: A show's season count and numbers leave out specials
The season count and season numbers the API reports for a show, in the v2 show list and in the v2 and v3 add-show replies, SHALL leave out season 0, matching the tile.

#### Scenario: Adding a season to a show with specials
- **WHEN** season 14 is added through the API to a show with seasons 1 to 13 and a season 0
- **THEN** the reply's `seasonCount` and `seasonNumbers` are both 14

#### Scenario: A show stored before this change
- **WHEN** the v2 show list is requested after deploy, for a show that already had a season 0
- **THEN** that show's `seasonCount` leaves season 0 out
