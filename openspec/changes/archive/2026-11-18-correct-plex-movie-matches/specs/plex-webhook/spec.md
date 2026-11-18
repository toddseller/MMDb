# Spec Delta

## ADDED Requirements

### Requirement: A movie import adds an already-stored movie to the collection
When Plex reports a new movie whose title and year match a stored movie, the import SHALL add that stored movie to the configured user's collection, and SHALL NOT create a second row.

#### Scenario: Another user stored the movie first
- **WHEN** Plex reports "Get Carter" (1971), another user's collection already has Get Carter (1971), and the configured user's does not
- **THEN** the configured user's collection has Get Carter (1971) and only one Get Carter (1971) row exists

#### Scenario: Movie already in the collection
- **WHEN** Plex reports a movie the configured user's collection already has
- **THEN** the collection lists it once

### Requirement: An import records the Plex item ID
A movie import SHALL store the reported item's Plex ID on the movie it adds. A show-level or single-episode import SHALL store the show's Plex ID on the show it adds to.

#### Scenario: New movie
- **WHEN** Plex reports "Madden" (2026) with item ID 134511 and the import adds Madden (2026)
- **THEN** Madden (2026) has Plex ID 134511

#### Scenario: Single episode
- **WHEN** Plex reports an episode whose show has Plex ID 9001 and the import adds it to "The Lowdown"
- **THEN** The Lowdown has Plex ID 9001

#### Scenario: Nothing imported
- **WHEN** Plex reports a movie the search can't find
- **THEN** no movie's Plex ID changes
