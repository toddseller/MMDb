# Spec Delta

## ADDED Requirements

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
