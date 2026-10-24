# Spec Delta

## Purpose

Defines how a user narrows their movie collection on the collection page (by title, unwatched or 4K) and gets back to the full collection, without leaving the page.

## ADDED Requirements

### Requirement: Title search narrows the collection as the user types
Typing in the collection's search box SHALL replace the grid with the movies whose titles match, once the user has paused typing for 300ms. The page SHALL NOT reload, and the movie count SHALL show the number found.

#### Scenario: Partial title
- **WHEN** the user types `amb` in "Search Collection"
- **THEN** after a short pause only "Amber" is shown, without a page load

#### Scenario: Typing quickly
- **WHEN** the user types several letters with less than 300ms between them
- **THEN** one search is made, for the full text typed

### Requirement: Unwatched and 4K show only those movies
The Unwatched and 4K links SHALL replace the grid with the user's unwatched or 4K movies without a page load, mark the chosen link as active and unmark the other. They SHALL keep working after the collection has been cleared.

#### Scenario: Unwatched
- **WHEN** the user clicks Unwatched
- **THEN** only movies marked new are shown, and Unwatched is marked active

#### Scenario: After clearing
- **WHEN** the user clears a search and then clicks 4K
- **THEN** only 4K movies are shown, without a page load

### Requirement: Clear and Library restore the full collection
The Clear button and the Library link SHALL empty the search box, unmark Unwatched and 4K, close any open details drawer, and show the full collection again without a page load.

#### Scenario: Clear after a search
- **WHEN** a search shows one movie and the user clicks Clear
- **THEN** all movies are shown and the search box is empty
