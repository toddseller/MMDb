# Spec Delta

## ADDED Requirements

### Requirement: A show's seasons stay on one line
A show's season buttons SHALL sit on a single line that never wraps. When they don't all fit across the drawer, the line SHALL scroll sideways, including by a finger swipe or trackpad. When they all fit, the line SHALL look as it did before, with no arrows.

#### Scenario: A long-running show
- **WHEN** a user opens a show with 48 seasons in a 1500px wide window
- **THEN** all 48 season buttons are on one line, and the seasons that don't fit are reached by scrolling the line

#### Scenario: A show whose seasons fit
- **WHEN** a user opens a show with 3 seasons
- **THEN** its season buttons are on one line and no arrows show

### Requirement: Arrows scroll the season line
Each arrow SHALL scroll the season line by its visible width, gliding unless the system asks for reduced motion, when it SHALL jump. The left arrow SHALL show only while the line is scrolled past its start, and the right arrow only while seasons are hidden past its end. Each arrow SHALL be a button named for screen readers: "Earlier seasons" and "Later seasons".

#### Scenario: Scrolling from the start
- **WHEN** a show's season line is at its start and more seasons are hidden to the right
- **THEN** only the right arrow shows; clicking it glides the line one visible width and shows the left arrow

#### Scenario: Reaching the end
- **WHEN** the season line is scrolled to its end
- **THEN** the right arrow hides and the left arrow shows

#### Scenario: Reduced motion
- **WHEN** a user whose system asks for reduced motion clicks an arrow
- **THEN** the line moves one visible width at once, without gliding

### Requirement: The season line opens on the active season
When a show's drawer opens, or an open drawer moves to another show, the season line SHALL already be placed so the active season is fully in view, with no visible scrolling. An active season that fits from the start SHALL leave the line at its start.

#### Scenario: Active season at the end
- **WHEN** a user opens a 48-season show whose active season is 48
- **THEN** season 48 is in view at the end of the line, the left arrow shows and the right arrow doesn't, and the line did not scroll while the drawer opened

#### Scenario: Active season near the start
- **WHEN** a user opens a 48-season show whose active season is 3
- **THEN** the line is at its start, and only the right arrow shows

#### Scenario: Moving the drawer to another long show
- **WHEN** a show's drawer is open and the user clicks another show in the same row whose active season is its last
- **THEN** the drawer shows that show with its last season in view

### Requirement: The season line stays put when the drawer reloads
When the owner switches seasons in a show's drawer, or adds episodes while its drawer is open, the season line SHALL keep the scroll position it had, so nothing in it moves.

#### Scenario: Switching to a season in the middle
- **WHEN** the season line is scrolled to show seasons 19 to 35 and the owner clicks season 20
- **THEN** the drawer shows season 20, and the line still shows seasons 19 to 35

#### Scenario: Adding episodes with the drawer open
- **WHEN** a show's drawer is open with its season line scrolled partway, and the owner adds episodes of that show from the search panel
- **THEN** the season line keeps its position
