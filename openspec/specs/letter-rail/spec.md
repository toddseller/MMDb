# letter-rail Specification

## Purpose
Defines the letter rail on collection grids: a side index that lets a user move straight to the titles filed under a letter instead of scrolling past every poster before them.

## Requirements

### Requirement: Collection grids offer a letter rail
A user's movies, a user's shows, another user's collection and a movie collection's own page SHALL offer a rail on the right of the window listing `#` then A to Z. The letters SHALL share the full height below the top bar, each over its whole share, and on desktop the rail SHALL sit within the side margin. The rail SHALL NOT make the page scroll sideways. The home page SHALL NOT show a rail.

#### Scenario: Desktop collection
- **WHEN** a user's movies are shown in a 1500x1000 window
- **THEN** the rail lists `#` and A to Z on the right from just below the top bar to near the bottom of the window, and covers no poster

#### Scenario: Phone collection
- **WHEN** a user scrolls a long movie collection in a 390px wide window
- **THEN** the rail is shown on the right from just below the pinned bar to near the bottom of the screen, and the page does not scroll sideways

#### Scenario: Home page
- **WHEN** the home page is scrolled to the end
- **THEN** no rail is shown

### Requirement: The rail is always shown on desktop
On desktop a collection page SHALL show the rail at all times, from the top of the page, whatever the grid's length.

#### Scenario: Top of the page
- **WHEN** a long collection is first shown in a 1500px wide window
- **THEN** the rail is visible

#### Scenario: Desktop pause
- **WHEN** a desktop user scrolls a long collection and stops for 3 seconds
- **THEN** the rail is still visible

### Requirement: On phones the rail appears while scrolling a long grid
Below the phone breakpoint the rail SHALL be hidden until the page has scrolled at least one window height, and SHALL hide again when scrolled back above that point. It SHALL NOT appear while the page is less than three window heights tall. It SHALL fade out about 2.5 seconds after scrolling stops, appear again when scrolling resumes, and SHALL NOT fade while a finger is on it.

#### Scenario: Top of the page on a phone
- **WHEN** a long collection is first shown in a 390px wide window
- **THEN** the rail is not visible

#### Scenario: Scrolled one screen
- **WHEN** a phone user scrolls a long collection down by more than one window height
- **THEN** the rail becomes visible

#### Scenario: Back at the top
- **WHEN** the rail is visible on a phone and the user scrolls back to the top
- **THEN** the rail is hidden

#### Scenario: Short grid
- **WHEN** a search on a phone leaves a grid that, with the page, is less than three window heights tall, and the user scrolls to its end
- **THEN** the rail is not visible

#### Scenario: Phone pause
- **WHEN** a phone user scrolls a long collection past one screen and stops for 4 seconds
- **THEN** the rail is no longer visible

#### Scenario: Finger on the rail
- **WHEN** a phone user holds a finger on the rail for 4 seconds
- **THEN** the rail stays visible

### Requirement: Titles file under the letter of their sort name
Each title SHALL file under the first letter of the name the grid is sorted by, which drops a leading The, A or An. An accented first letter SHALL file under its plain letter, where the grid sorts it. A title whose sort name starts with anything else SHALL file under `#`.

#### Scenario: Leading article
- **WHEN** a collection holds "The Matrix"
- **THEN** it files under M

#### Scenario: Leading digit
- **WHEN** a collection holds "12 Angry Men"
- **THEN** it files under `#`

#### Scenario: Accented first letter
- **WHEN** a collection holds "Éclair" and "Edge" and no other title under E
- **THEN** "Éclair" files under E, and choosing E brings "Éclair" to the top

#### Scenario: Show with an edited sort name
- **WHEN** a show titled "Star Trek: Picard" has its sort name edited to `picard`
- **THEN** it files under P

### Requirement: Choosing a letter brings its first title to the top
Choosing a letter SHALL scroll the page so the row holding the first title filed under that letter sits at the top of the grid's visible area, below any pinned bar.

#### Scenario: Letter with titles
- **WHEN** a user chooses M in a collection holding "The Matrix"
- **THEN** the row holding "The Matrix" is at the top of the visible grid, and no title filed under M comes before it

#### Scenario: Below the pinned bar
- **WHEN** a phone user chooses a letter
- **THEN** the first title filed under that letter is fully visible below the pinned bar

### Requirement: Letters with no titles cannot be chosen
Every letter SHALL share one muted look, whether or not it has titles. Only a letter with titles SHALL highlight on hover. Choosing a letter with no titles by click, tap, drag or keyboard SHALL do nothing.

#### Scenario: Empty letter clicked
- **WHEN** a collection has no titles under Q and the user clicks Q
- **THEN** the page does not move

#### Scenario: Same look
- **WHEN** a collection has no titles under Q
- **THEN** Q is drawn in the same colour as P and R

#### Scenario: Dragging over an empty letter
- **WHEN** a phone user drags from P to R along the rail in a collection with no titles under Q
- **THEN** the page moves from P to R without stopping for Q

### Requirement: The jump is animated without passing every row
Choosing a letter SHALL scroll with animation. When the target is more than two window heights away, the page SHALL first move instantly to two window heights from it and then glide the rest, so a jump takes about the same time whatever its distance and posters between the start and target are not loaded. With reduced motion the jump SHALL be instant.

#### Scenario: Far jump
- **WHEN** a user at A chooses W in a collection of about 4,500 movies
- **THEN** the page glides the last two screens to W, and no poster more than a few screens from W is requested

#### Scenario: Near jump
- **WHEN** the target letter is less than two window heights away
- **THEN** the page glides to it without an instant step

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion and chooses a letter
- **THEN** the page moves to the letter at once, without animation

### Requirement: Phones can drag along the rail
Below the phone breakpoint, dragging a finger along the rail SHALL move the page to each letter with titles that the finger passes, without waiting for an animation. On screens 500px tall or less the rail SHALL show every other letter, and a finger between two shown letters SHALL still choose the letter under it.

#### Scenario: Dragging
- **WHEN** a phone user drags from A to M along the rail
- **THEN** the page follows the letters under the finger and ends at M

#### Scenario: Phone held sideways
- **WHEN** a long collection is scrolled on a 926x428 window
- **THEN** the rail shows every other letter, fits the height below the pinned bar, and no letter overlaps another

### Requirement: The rail follows the grid on screen
When a search, Unwatched, 4K, Clear or Library replaces the grid, the rail SHALL reflect the new grid: which letters can be chosen, where each leads, and on phones whether the grid is long enough to show it.

#### Scenario: After a search
- **WHEN** a search leaves only titles under M and S
- **THEN** only M and S can be chosen

#### Scenario: After Clear on a phone
- **WHEN** a phone user clears a search that had left a short grid
- **THEN** the rail appears again once the full collection is scrolled past one screen

### Requirement: An open drawer closes before a jump
Choosing a letter with titles while a details drawer is open SHALL close the drawer at once, without its closing animation, before the page moves.

#### Scenario: Drawer open
- **WHEN** a user has a movie's details open and chooses a letter
- **THEN** the drawer is closed and the first title under that letter is at the top of the visible grid

### Requirement: The rail works by keyboard and screen reader
The rail SHALL be a navigation landmark named "Jump to letter" whose letters are links. Letters with titles SHALL be reachable with Tab and chosen with Enter. Letters with no titles SHALL be skipped by Tab and announced as having no titles.

#### Scenario: Keyboard
- **WHEN** a user tabs to the rail's M link and presses Enter
- **THEN** the page moves to the first title under M

#### Scenario: Skipping an empty letter
- **WHEN** a collection has no titles under Q and the user tabs forward from P
- **THEN** focus moves to R

#### Scenario: Screen reader
- **WHEN** a screen reader lists the page's landmarks
- **THEN** a navigation landmark named "Jump to letter" is listed
