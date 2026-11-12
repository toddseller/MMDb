# Spec Delta

## MODIFIED Requirements

### Requirement: A season button sets the show's default season
In the drawer, each of the show's seasons SHALL have a button. Clicking one SHALL make that season the one the show opens on, show its details and episodes in the drawer, and put its poster on the show's grid tile at thumbnail size. The page SHALL NOT navigate.

#### Scenario: Choosing season 2
- **WHEN** the owner clicks season 2 in a show's drawer, then reloads and opens the show
- **THEN** the drawer shows season 2's episodes, and the tile shows season 2's poster

#### Scenario: Choosing Specials
- **WHEN** the owner clicks Specials in a show's drawer, then reloads and opens the show
- **THEN** the drawer shows season 0's episodes, and the tile shows season 0's poster

## ADDED Requirements

### Requirement: The edit dialog names a specials season Specials
The edit dialog's heading SHALL name season 0 "Specials" in place of "Season 0". The season number field SHALL still show the stored number.

#### Scenario: Editing a special
- **WHEN** the owner opens the edit dialog on a show whose active season is 0, holding 4 episodes
- **THEN** the heading reads "Specials, 4 episodes selected", and the season number field reads "0"
