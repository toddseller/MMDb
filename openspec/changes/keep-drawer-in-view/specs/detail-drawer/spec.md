# Spec Delta

## ADDED Requirements

### Requirement: The drawer glides into view when it opens or its content changes
When a drawer opens, switches poster, has its content reloaded (a season switch, adding episodes, a save) or its poster image loads, the page SHALL glide just far enough that the drawer's bottom is above the footer pinned to the bottom of the screen, without moving the open poster's row under the bar pinned to the top. Only opening a drawer MAY glide the page up.

#### Scenario: A poster near the bottom of the screen
- **WHEN** the owner clicks a poster whose row is near the bottom of the screen, and its drawer fits on screen below that row
- **THEN** the page glides until the whole drawer is above the bottom footer, and the poster stays in view

#### Scenario: A drawer taller than the screen
- **WHEN** the owner opens a drawer that, with its row, is taller than the space between the top bar and the bottom footer
- **THEN** the page glides until the poster's row sits just below the top bar, with the start of the drawer below it

#### Scenario: A drawer already in view
- **WHEN** the owner opens a drawer that already fits entirely on screen
- **THEN** the page does not move

#### Scenario: A poster partly under the top bar
- **WHEN** the owner clicks a poster that is partly hidden under the bar pinned to the top
- **THEN** the page glides up until the poster's row sits just below the top bar

#### Scenario: Switching to a poster in another row
- **WHEN** a drawer is open and the owner clicks a poster in another row, whose new drawer would end below the bottom footer
- **THEN** the poster stays where it was while the old drawer closes, and then the page glides the new drawer into view

#### Scenario: Switching seasons or adding episodes makes the drawer taller
- **WHEN** a show's drawer is in view, and switching its season or adding episodes makes it end below the bottom footer
- **THEN** the page glides down until the drawer's bottom is above the footer, without moving the show's row under the top bar

#### Scenario: Reading partway down a tall drawer
- **WHEN** the owner has scrolled partway down a drawer taller than the screen, and its content is reloaded
- **THEN** the page does not glide back up to the poster's row

#### Scenario: The drawer's poster finishes loading
- **WHEN** a drawer has just glided into view, and its poster image then loads and makes it taller
- **THEN** the page glides down again until the drawer's bottom is above the footer, as far as the row allows

#### Scenario: Reduced motion
- **WHEN** the user's system asks for reduced motion, and a drawer opens near the bottom of the screen
- **THEN** the page moves to the same place at once, without gliding

### Requirement: Height changes made inside the drawer leave the page still
Height changes the owner makes while reading inside an open drawer, such as expanding a long plot or opening a movie's edit form, SHALL NOT move the page.

#### Scenario: Expanding a plot or opening the edit form
- **WHEN** the owner taps "more" on a long plot, or opens a movie's edit form, and the drawer grows below the bottom footer
- **THEN** the page does not move
