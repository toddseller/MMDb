# Spec Delta

## ADDED Requirements

### Requirement: Show lists return the same order every time
Every show list SHALL return its shows in an order fixed by the stored data, so repeating a request gives the same order and pages never overlap or skip. Collection lists sort by sort name, then year, then oldest record first. Recently added sorts newest first, newest record first when added at the same moment.

#### Scenario: Same sort name and year
- **WHEN** a user owns two shows with the same title and year, and their collection or an API list of it is requested
- **THEN** the show added first comes first, on every request

#### Scenario: Added at the same moment
- **WHEN** the recently added shows are requested and two were created with the same timestamp
- **THEN** the one added last comes first, on every request
