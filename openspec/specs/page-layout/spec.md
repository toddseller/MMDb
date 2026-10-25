# page-layout Specification

## Purpose

Defines how the site's pages fit the window at any width, from a phone to a large monitor: how wide the page is, how many posters fit across, what stays pinned at the top while scrolling, and that visitors can zoom.

## Requirements

### Requirement: Pages fit the window without scrolling sideways
Every browsing page SHALL fill the window's width, less a side margin, at any width from 390px to 3840px, and SHALL NOT scroll sideways. Browsing pages are the home page, a user's movies and TV shows, another user's collection, and a movie's own page, signed in or not.

#### Scenario: Phone
- **WHEN** any browsing page is shown in a 390px wide window
- **THEN** the page is no wider than the window

#### Scenario: Large monitor
- **WHEN** a user's movies are shown in a 3840px wide window
- **THEN** the grid spans the window less its side margins, and the page does not scroll sideways

### Requirement: Side margins grow on wide screens
The side margins SHALL be 16px below the phone breakpoint and 40px on desktop windows up to about 1820px. From there they SHALL widen smoothly with the window, to about one movie poster and a gap (about 200px) at 2560px, until they are two movie posters and the gap between them wide (376px). They reach 376px at about 3350px and keep it on wider windows.

#### Scenario: Desktop window
- **WHEN** a page is shown in a 1500px wide window
- **THEN** each side margin is 40px

#### Scenario: 27-inch 4K monitor
- **WHEN** a page is shown in a 2560px wide window
- **THEN** each side margin is about 200px, one movie poster and a gap

#### Scenario: Wider still
- **WHEN** a page is shown in a 3840px wide window
- **THEN** each side margin is 376px

### Requirement: Visitors can zoom
Pages SHALL let visitors zoom with the browser's pinch or zoom controls; the viewport SHALL NOT set a maximum scale or disable scaling.

#### Scenario: Viewport meta
- **WHEN** any page is rendered
- **THEN** its viewport meta sets the device width and initial scale, and has no `maximum-scale` or `user-scalable=no`

### Requirement: Grids fit as many posters across as the window holds
The movie and show grids SHALL place as many posters in a row as fit at their desktop size, so a wider window shows more per row. Below the phone breakpoint, posters SHALL shrink so that a 390px window holds 3 movies or 2 shows across.

#### Scenario: Desktop window
- **WHEN** a user's movies are shown in a 1500px wide window
- **THEN** each full row holds 7 movies, as before this change

#### Scenario: Wide window
- **WHEN** a user's movies are shown in a 2560px wide window
- **THEN** each full row holds 10 movies, and a user's shows hold 9 per row

#### Scenario: Phone
- **WHEN** a user's movies are shown in a 390px wide window
- **THEN** each full row holds 3 movies, and a user's shows hold 2 per row

### Requirement: Posters keep their shape at every size
A poster SHALL keep its artwork's proportions whatever its size, so movie posters stay 2:3 and show posters stay square, and no title under a poster SHALL overflow its tile.

#### Scenario: Shrunk on a phone
- **WHEN** a user's movies are shown in a 390px wide window
- **THEN** each poster is 1.5 times as tall as it is wide

#### Scenario: A failed poster
- **WHEN** a poster fails to load on a phone and its fallback image is shown
- **THEN** the tile keeps the same height as its neighbours, so the page does not shift

#### Scenario: A long title
- **WHEN** a movie or show on a 390px wide window has a title too long for one line
- **THEN** the title is cut off inside its tile, the tile is no wider than its neighbours, and the page does not scroll sideways

### Requirement: Phones pin a compact bar with search
Below the phone breakpoint, and on any screen 500px tall or less, a collection page SHALL pin a single bar at the top holding the logo, the collection search with its Clear button, and the menu button, or the Sign in button for a visitor. The Add, Movies or TV Shows, and Library, Unwatched and 4K controls SHALL sit above the grid and scroll away with it. Search SHALL work as on desktop.

#### Scenario: Scrolled down
- **WHEN** a signed-in user on a phone scrolls their movies down by several screens
- **THEN** the search box and menu button are still at the top of the screen, and the Library link is not on screen

#### Scenario: Searching from the pinned bar
- **WHEN** a user on a phone types `amb` in "Search Collection"
- **THEN** only "Amber" is shown, as on desktop

#### Scenario: Visitor
- **WHEN** a visitor who is not signed in views a collection on a phone
- **THEN** the pinned bar holds the logo, the search box and the Sign in button, and none overlaps another

#### Scenario: Phone held sideways
- **WHEN** a signed-in user on a 926x428 window scrolls their movies to the end
- **THEN** the logo, search box and menu button sit in the 50px bar at the top, and the Library link is not on screen

### Requirement: The menu fits a phone
On a phone, the signed-in menu and its Profile submenu SHALL open fully within the screen and every item SHALL be tappable. The "Signed in as" text SHALL NOT be shown below the phone breakpoint.

#### Scenario: Opening the menu on a phone
- **WHEN** a signed-in user on a 390px wide window opens the menu, then Profile
- **THEN** Movies and TV Shows are visible within the screen, and tapping TV Shows shows their show grid

### Requirement: The home page stacks on a phone
Below the phone breakpoint, the home page SHALL show Most Popular Movies and Recently Added Movies first, two posters across, and the list of users below them.

#### Scenario: Home page on a phone
- **WHEN** the home page is shown in a 390px wide window
- **THEN** the popular movies show two per row, and the user list starts below the recent movies

### Requirement: The filmography header fits a phone
The header shown after choosing a person from a movie's credits, with their photo and name, SHALL fit within the window on a phone.

#### Scenario: Credit chosen on a phone
- **WHEN** a user on a 390px wide window chooses an actor from a movie's details
- **THEN** the actor's photo and name are fully within the screen, and the page does not scroll sideways
