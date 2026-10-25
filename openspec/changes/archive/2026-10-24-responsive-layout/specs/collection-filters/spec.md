# Spec Delta

## MODIFIED Requirements

### Requirement: Clear and Library restore the full collection
The Clear button and the Library link SHALL empty the search box, unmark Unwatched and 4K, close any open details drawer, and show the full collection again without a page load. They SHALL do so in a new tab that has not searched yet, taking the collection's owner from the page.

#### Scenario: Clear after a search
- **WHEN** a search shows one movie and the user clicks Clear
- **THEN** all movies are shown and the search box is empty

#### Scenario: Library in a new tab
- **WHEN** a user opens a collection in a new tab, clicks Unwatched, then Library, without searching first
- **THEN** all movies are shown again

#### Scenario: Clear in a new tab
- **WHEN** a user opens a collection in a new tab, clicks Unwatched, then Clear, without searching first
- **THEN** all movies are shown again
