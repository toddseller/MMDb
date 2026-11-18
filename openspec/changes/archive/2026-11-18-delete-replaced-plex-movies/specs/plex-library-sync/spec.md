# Spec Delta

## MODIFIED Requirements

### Requirement: The correction pass removes the replaced movie
Once the right movie is in the owner's collection and linked, the pass SHALL remove the replaced movie from the owner's collection and clear its Plex ID. When no other user has the replaced movie, the pass SHALL then delete its row and any ratings on it. When another user has it, the row SHALL stay. When the right movie could not be imported, the replaced movie SHALL stay as it is.

#### Scenario: Replacement found
- **WHEN** the pass has added Madden (2026) for Plex item 134511, and no other user has Madden (2023)
- **THEN** Madden (2023) is no longer in the owner's collection, and its row and the owner's rating of it no longer exist

#### Scenario: Another user has the replaced movie
- **WHEN** the pass has added Madden (2026) for Plex item 134511, and another user's collection has Madden (2023)
- **THEN** Madden (2023) is no longer in the owner's collection, has no Plex ID, and stays in the other user's collection

#### Scenario: Search finds nothing
- **WHEN** Plex lists 134511 as Madden (2026) and the search lists no Madden (2026)
- **THEN** Madden (2023) stays in the owner's collection, linked to 134511

### Requirement: The correction pass reports what it changed
The pass SHALL print one line for each movie it imports, each movie it deletes and each movie it removes from the collection but keeps, naming the title and year, and SHALL print nothing when it changes nothing.

#### Scenario: A correction
- **WHEN** the pass replaces Madden (2023) with Madden (2026) and no other user has Madden (2023)
- **THEN** its output names Madden (2026) as added and Madden (2023) as deleted

#### Scenario: A correction that keeps the row
- **WHEN** the pass replaces Madden (2023) with Madden (2026) and another user has Madden (2023)
- **THEN** its output names Madden (2026) as added and Madden (2023) as removed
