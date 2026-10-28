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

### Requirement: The drawer eases open and closed to fit its content
The drawer SHALL grow from closed to the height of its content when it opens, and shrink back to closed when it closes, easing in both directions. Content that grows after opening, such as images loading, SHALL make the drawer grow with it.

#### Scenario: Opening
- **WHEN** a drawer opens
- **THEN** it is first shown closed, then grows to its content's height without pausing at full size

#### Scenario: Closing by clicking the poster again
- **WHEN** the user clicks the poster of the open drawer
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

### Requirement: The drawer's content fits the window
The drawer's content SHALL fit within the window at any width and keep the page's side margins. Below the phone breakpoint, the poster SHALL sit above the details, no wider than the screen. On a window wider than the desktop layout, the content SHALL keep its desktop width, centered, while the drawer's background still spans the window.

#### Scenario: Phone
- **WHEN** a user on a 390px wide window taps a poster
- **THEN** the drawer's poster is above its title, both within the screen, and the page does not scroll sideways

#### Scenario: Wide window
- **WHEN** a user on a 2560px wide window clicks a poster
- **THEN** the drawer's details are no wider than on a 1500px window and are centered under the row

#### Scenario: Phone held sideways
- **WHEN** a user on a 926x428 window taps a movie or a show
- **THEN** the drawer's text starts at least 40px from the left edge and ends at least 40px from the right edge

### Requirement: The drawer follows a turned phone
When the window's width changes while a drawer is open, the drawer SHALL move to directly below the open poster's row as it now falls, so no row is split or left short. When only the window's height changes, as when a phone browser's address bar grows or shrinks during a scroll, the drawer SHALL stay where it is.

#### Scenario: Portrait to landscape
- **WHEN** a drawer is open on a 390x844 window and the window turns to 926x428
- **THEN** the open poster's row is full and the drawer sits directly below it

#### Scenario: Landscape to portrait
- **WHEN** a drawer is open on a 926x428 window and the window turns to 390x844
- **THEN** the open poster's row is full and the drawer sits directly below it

#### Scenario: Only the height changes
- **WHEN** a signed-in user has focused a rating star in an open drawer and the window's height changes but not its width
- **THEN** the star keeps focus

### Requirement: A movie's details stay whole on a phone
On a phone, a movie's details SHALL stay within the screen even when they include a studio. The runtime, year, genre, rating and HD badges and the stars SHALL each keep their size, wrapping to a new line as whole pieces rather than squeezing each other.

#### Scenario: A movie with a studio
- **WHEN** a user on a 390px wide window opens a movie that has a studio
- **THEN** its plot, its info row and every rule line in the drawer are within the screen

#### Scenario: Badges and stars
- **WHEN** a user on a 390px wide window opens a movie
- **THEN** the HD badge is its full 26px wide, and all five stars sit on one line

### Requirement: A show's details stay whole at every width
A show's poster SHALL never run under the details beside it. On a phone, the owner's edit button SHALL sit above the poster, not over it. Below 1200px, where the drawer's columns stack, each episode's runtime and "more" SHALL stay within the screen, with "more" below its plot.

#### Scenario: Narrow desktop window
- **WHEN** a user on a 1300px wide window opens a show
- **THEN** the poster ends before the details beside it begin

#### Scenario: Desktop window
- **WHEN** a user on a 1500px wide window opens a show
- **THEN** its poster is 447x447 and ends before the details beside it begin

#### Scenario: Owner on a phone
- **WHEN** the show's owner opens it on a 390px wide window
- **THEN** the edit button does not overlap the poster

#### Scenario: Episodes below 1200px
- **WHEN** a user opens a show on a 390px window or a 926x428 window
- **THEN** each episode's runtime and "more" are within the screen, and "more" sits below its plot

### Requirement: An open drawer stays open when episodes are added
When the owner adds episodes from the search panel while a show's drawer is open, that drawer SHALL stay open under the same show's poster, whichever show the episodes went to, and show that show's details as they are after the add. It SHALL stay on the season it was showing, appear with no moment where it is gone, and ease from its old height to its new one. The open poster SHALL stay where it was on screen, as far as the page can scroll.

#### Scenario: Adding missing episodes to the open show's season
- **WHEN** a show's drawer is open on a season, and the owner adds that season's missing episodes from the search panel
- **THEN** the drawer stays open under the show's poster and lists the new episodes, easing to its new height

#### Scenario: Adding episodes to another show
- **WHEN** a show's drawer is open, and the owner adds episodes to a different show
- **THEN** the drawer stays open under the first show's poster, showing that show's details

#### Scenario: Adding another season of the open show
- **WHEN** a show's drawer is open on one season, and the owner adds episodes of another season of the same show
- **THEN** the drawer stays open on the season it was showing, and the show's poster and active season are unchanged

#### Scenario: A new show lands above the open one
- **WHEN** a show's drawer is open, and the add creates a new show that sorts before it
- **THEN** the open poster stays where it was on screen, with the drawer below its row

#### Scenario: Reduced motion
- **WHEN** the user's system asks for reduced motion, and episodes are added with a drawer open
- **THEN** the drawer changes to its new height without animating

#### Scenario: The open show is no longer in the grid
- **WHEN** a show's drawer is open, and after the add that show's poster is missing from the redrawn grid or hidden in it
- **THEN** no drawer is open

#### Scenario: No drawer open
- **WHEN** no drawer is open, and the owner adds episodes
- **THEN** the shows and their counts update and no drawer opens, as before

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

### Requirement: Height changes made inside the drawer leave the page still
Height changes the owner makes while reading inside an open drawer, such as expanding a long plot or opening a movie's edit form, SHALL NOT move the page.

#### Scenario: Expanding a plot or opening the edit form
- **WHEN** the owner taps "more" on a long plot, or opens a movie's edit form, and the drawer grows below the bottom footer
- **THEN** the page does not move

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
