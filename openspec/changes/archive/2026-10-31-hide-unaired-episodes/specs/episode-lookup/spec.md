# Spec Delta

## ADDED Requirements

### Requirement: The episode list for adding episodes shows only aired episodes
When a stored season's episodes are listed for adding by hand or through the APIs, the list SHALL include only episodes whose air date is today or earlier. An episode with no air date SHALL NOT be listed. This SHALL apply to seasons from both Apple and TMDB, and SHALL NOT change what the Plex webhook imports.

#### Scenario: Apple season with aired, upcoming and undated episodes
- **WHEN** an Apple season's episodes 1 and 2 aired before today, episode 3 airs today, episode 4 airs next week and episode 5 has no air date
- **THEN** episodes 1, 2 and 3 are listed and episodes 4 and 5 are not

#### Scenario: TMDB season
- **WHEN** a TMDB season lists one episode that aired yesterday and one that airs next week
- **THEN** only the episode that aired yesterday is listed
