# Spec Delta

## ADDED Requirements

### Requirement: The drawer's poster holds its size while it loads
The drawer's poster SHALL take its full size before its image arrives, so nothing in the drawer moves when it loads. A movie's poster SHALL be 2:3 and a show's square, at the width each has at that window size. A show poster of another shape SHALL fit whole inside the square, centred, without being stretched or cropped.

#### Scenario: Movie on desktop
- **WHEN** a user on a 1500px wide window opens a movie whose poster has not loaded yet
- **THEN** the drawer's poster is already 340x510

#### Scenario: Show on desktop
- **WHEN** a user on a 1500px wide window opens a show whose poster has not loaded yet
- **THEN** the drawer's poster is already 447x447

#### Scenario: Phone
- **WHEN** a user on a 390px wide window opens a movie or a show whose poster has not loaded yet
- **THEN** the title starts below the poster's full 2:3 or square box, and stays there when the poster loads

#### Scenario: A portrait show poster
- **WHEN** a user on a 1500px wide window opens a show whose poster is 2:3
- **THEN** the poster stays 447x447 and the whole image shows in it, centred

### Requirement: The drawer's poster shows the image already on screen while it loads
Until its own image has loaded, the drawer's poster SHALL show the same title's image the user was just looking at: the grid poster that was clicked when the drawer opens or switches to another title, or the previous season's poster when the owner switches seasons. Where there is no such image, the box SHALL show the theme's poster colour. Once the poster has loaded, only the poster SHALL show.

#### Scenario: Opening a drawer
- **WHEN** a user clicks a grid poster and the drawer's full poster has not loaded yet
- **THEN** the drawer's poster box shows the grid poster that was clicked

#### Scenario: Another title in the same row
- **WHEN** a drawer is open and the user clicks another poster in the same row before its full poster has loaded
- **THEN** the drawer's poster box shows the newly clicked grid poster

#### Scenario: Switching seasons
- **WHEN** the owner switches a show's drawer to another season whose poster has not loaded yet
- **THEN** the drawer's poster box shows the previous season's poster until the new one loads

#### Scenario: A season with no poster
- **WHEN** the owner switches a show's drawer to a season that has no poster
- **THEN** the drawer's poster box shows the theme's poster colour, not the previous season's poster

#### Scenario: Poster loaded
- **WHEN** the drawer's poster has loaded and is a different shape from its box
- **THEN** no placeholder image shows around it

## MODIFIED Requirements

### Requirement: The drawer glides into view when it opens or its content changes
When a drawer opens, switches poster, or has its content reloaded (a season switch, adding episodes, a save), the page SHALL glide just far enough that the drawer's bottom is above the footer pinned to the bottom of the screen, without moving the open poster's row under the bar pinned to the top. Only opening a drawer MAY glide the page up.

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
- **WHEN** a drawer has just glided into view, and its poster image then loads
- **THEN** the drawer keeps its height and the page does not move

#### Scenario: Reduced motion
- **WHEN** the user's system asks for reduced motion, and a drawer opens near the bottom of the screen
- **THEN** the page moves to the same place at once, without gliding
