# Spec Delta

## Purpose

Lets people move around the site: the signed-in menu, switching between a user's movies and TV shows without a page load, and previewing a popular or recent movie from the home page.

## ADDED Requirements

### Requirement: The menu opens and closes
The menu button SHALL open and close the signed-in menu. Profile SHALL open and close its submenu of Movies and TV Shows. Closing the menu SHALL also close the submenu. Opening Account Settings SHALL close the menu.

#### Scenario: Opening the submenu
- **WHEN** a signed-in user clicks the menu button, then Profile
- **THEN** the menu shows Movies and TV Shows

#### Scenario: Closing the menu closes the submenu
- **WHEN** the submenu is open and the user clicks the menu button
- **THEN** the menu and the submenu are both closed, and opening the menu again shows the submenu closed

### Requirement: Switching between movies and TV shows
The menu's Movies and TV Shows, and the Movies or TV Shows button on another user's collection, SHALL replace the page's collection with the chosen one without a page load. Each click SHALL send exactly one request. The menu and submenu SHALL close.

#### Scenario: From movies to TV shows by the menu
- **WHEN** a signed-in user on their movies opens the menu, then Profile, then TV Shows
- **THEN** their show grid replaces the movie grid, the menu is closed, and one request was sent

#### Scenario: From TV shows to movies by the menu
- **WHEN** a signed-in user on their shows opens the menu, then Profile, then Movies
- **THEN** their movie grid replaces the show grid, the menu is closed, and one request was sent

#### Scenario: From another user's movies to their TV shows
- **WHEN** a signed-in user viewing another user's movies clicks that page's TV Shows button
- **THEN** the other user's show grid replaces the movie grid, and one request was sent

#### Scenario: From another user's TV shows to their movies
- **WHEN** a signed-in user viewing another user's shows clicks that page's Movies button
- **THEN** the other user's movie grid replaces the show grid, and one request was sent

### Requirement: The footer counts the collection switched to
After a switch, the footer SHALL read "<n> Movies" for movies, and "<n> TV Shows", an em dash (U+2014) and "<m> Episodes" for shows, spaced as today, counting that user's collection.

#### Scenario: Footer after switching to TV shows
- **WHEN** a user switches to a collection of 2 shows with 5 episodes in all
- **THEN** the footer reads "2 TV Shows", the em dash, then "5 Episodes"

#### Scenario: Footer after switching to movies
- **WHEN** a user switches to a collection of 30 movies
- **THEN** the footer reads "30 Movies"

### Requirement: Home page posters open the movie's details
Clicking a poster under Most Popular Movies or Recently Added Movies on the home page SHALL open a dialog with that movie's details without leaving the page.

#### Scenario: Previewing a popular movie
- **WHEN** a visitor clicks a poster on the home page
- **THEN** a dialog opens showing that movie's title, and the page has not navigated
