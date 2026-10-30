# Spec Delta

## ADDED Requirements

### Requirement: Movie lists return the same order every time
Every movie list SHALL return its movies in an order fixed by the stored data, so repeating a request gives the same order and pages never overlap or skip. Collection lists sort by sort name, then year, then oldest record first. Top movies sort by owner count, most first, then oldest record first. Recently added sorts newest first, newest record first when added at the same moment.

#### Scenario: Same sort name and year
- **WHEN** a user owns two movies with the same title and year, and their collection, an API list of it, or a filter matching both is requested
- **THEN** the movie added first comes first, on every request

#### Scenario: Tie at a page boundary
- **WHEN** a user's collection is read page by page and movies sharing a sort name and year straddle the page boundary
- **THEN** every movie appears exactly once across the pages

#### Scenario: Same owner count
- **WHEN** the top movies are requested and several movies have the same number of owners
- **THEN** among those, the movie added first comes first, on every request

#### Scenario: Added at the same moment
- **WHEN** the recently added movies are requested and two were created with the same timestamp
- **THEN** the one added last comes first, on every request
