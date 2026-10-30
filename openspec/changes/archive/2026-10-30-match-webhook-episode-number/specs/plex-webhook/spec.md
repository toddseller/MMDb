# Spec Delta

## ADDED Requirements

### Requirement: A single-episode import identifies the episode by its number
When Plex reports one episode, the import SHALL add the fetched episode of the reported season whose episode number equals the number Plex reported, whatever either source calls it. A fetched episode with a different number SHALL NOT be added.

#### Scenario: Titles spelled differently
- **WHEN** Plex reports season 6 episode 1 titled "Halloween 6: The Mirror (1)" and the source lists season 6 episode 1 as "Halloween 6: The Mirror, Part 1"
- **THEN** episode 1 is added with the source's title "Halloween 6: The Mirror, Part 1"

#### Scenario: Source returns another episode
- **WHEN** Plex reports season 1 episode 2 and the source answers with season 1 episode 3
- **THEN** no episode is added
