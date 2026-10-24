# detail-drawer Specification

## Purpose

Defines how a movie's or show's details open, switch and close in a drawer under its poster in the collection grid, so the motion is smooth and the drawer always appears under the right row.

## Requirements

### Requirement: The drawer opens under the clicked poster's row
Clicking a poster SHALL open its details in a drawer that spans the full width of the grid directly below the row holding that poster. The row SHALL be decided by where posters actually sit in the page, so the drawer is placed correctly at any window width and with any filter applied.

#### Scenario: Filtered list
- **WHEN** a filter hides some movies, and the user clicks the second visible movie of the second row
- **THEN** the drawer appears below the last visible movie of that row and above the first visible movie of the next

#### Scenario: Last, partly filled row
- **WHEN** the user clicks a poster in a last row that holds fewer posters than the others
- **THEN** the drawer appears below that row, at the end of the list

### Requirement: The drawer eases open and closed to its content's height
The drawer SHALL grow from closed to the height of its content when it opens, and shrink back to closed when it closes, easing in both directions. It SHALL animate whether closed by clicking its poster again or by its close button. Content that grows after opening, such as images loading, SHALL make the drawer grow with it.

#### Scenario: Opening
- **WHEN** a drawer opens
- **THEN** it is first shown closed, then grows to its content's height without pausing at full size

#### Scenario: Closing with the close button
- **WHEN** the user clicks the drawer's close button
- **THEN** the drawer shrinks closed, and clicking the same poster then opens it again with one click

### Requirement: One drawer at a time, switched smoothly
At most one drawer SHALL be open:
- Clicking the open poster closes it.
- Clicking another poster in the same row replaces the drawer's content in place, easing to the new height.
- Clicking a poster in another row closes the old drawer while the new one opens, and the page scrolls so the clicked poster stays where it was on screen, as far as the page can scroll.

#### Scenario: Same row
- **WHEN** a drawer is open and the user clicks another poster in the same row
- **THEN** the drawer stays open and shows the new poster's details

#### Scenario: Another row
- **WHEN** a drawer is open under row 1 and the user clicks a poster in row 3
- **THEN** the drawer under row 1 closes while one opens under row 3, and the clicked poster doesn't move on screen

### Requirement: The open poster is marked without moving its neighbours
The poster whose details are open SHALL appear enlarged, with the pointer below it, and the other posters SHALL keep their positions.

#### Scenario: Poster enlarged
- **WHEN** a poster's drawer is open
- **THEN** that poster is shown larger with the pointer under it, and its neighbours haven't moved

### Requirement: Reduced motion is respected
When the user's system asks for reduced motion, the drawer SHALL open, switch and close without animating, and the page SHALL not scroll smoothly.

#### Scenario: Reduced motion
- **WHEN** reduced motion is requested and the user clicks a poster
- **THEN** the drawer appears open at once

### Requirement: The drawer stays smooth in large collections
Opening, switching and closing the drawer SHALL keep frames short in a grid of thousands of posters, by not rendering tiles far from the screen. Scrolling the grid SHALL NOT freeze.

#### Scenario: Thousands of movies
- **WHEN** a drawer opens in a grid of 4,526 movies on a desktop browser
- **THEN** the median frame during the animation is under 25ms, close to the shows grid's 17ms

#### Scenario: Long scroll
- **WHEN** the user jumps from the top of a 4,526-movie grid to the middle
- **THEN** the page shows the new posters without freezing
