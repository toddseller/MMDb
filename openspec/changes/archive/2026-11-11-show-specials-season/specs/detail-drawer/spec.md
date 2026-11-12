# Spec Delta

## ADDED Requirements

### Requirement: A show's specials are named Specials and come last
In a show's drawer, the button for season 0 SHALL read "Specials" and SHALL come after the button of the show's last regular season. Every other season button SHALL read its season number, in ascending order.

#### Scenario: A show with specials
- **WHEN** a user opens a show with seasons 0, 1 and 2
- **THEN** the season buttons read "1", "2" and "Specials", in that order

#### Scenario: A show without specials
- **WHEN** a user opens a show with seasons 1, 2 and 3
- **THEN** the season buttons read "1", "2" and "3"

### Requirement: The drawer's season counts leave out specials
The drawer's season count and season line SHALL count only regular seasons, and its episode count SHALL include the specials' episodes. A show whose only season is 0 SHALL read "Specials" where a season would be named.

#### Scenario: Fourteen seasons and specials
- **WHEN** a user opens a show with seasons 1 to 14 holding 212 episodes and a season 0 holding 4
- **THEN** the drawer reads "14 seasons, 216 episodes"

#### Scenario: One season and specials
- **WHEN** a user opens a show with season 3 holding 9 episodes and a season 0 holding 2
- **THEN** the drawer reads "1 season, 11 episodes" and names the season "Season 3"

#### Scenario: Only specials
- **WHEN** a user opens a show whose only season is 0, holding 4 episodes
- **THEN** the drawer reads "Specials, 4 episodes" and names the season "Specials"
