# Spec Delta

## MODIFIED Requirements

### Requirement: Picking a show's season leads to adding its episodes
Picking a show's season SHALL show the adding message, then list that season's episodes in the panel, with Add All Episodes. Picking an episode, or Add All Episodes, SHALL add it or them. The panel SHALL then close, the add button SHALL replace the search box, and the shows and their counts SHALL update. When the season has no episodes to list, the panel SHALL offer Create New Show instead, and it SHALL open the Create New Show dialog.

#### Scenario: Adding a whole season
- **WHEN** the user picks a show's season, then Add All Episodes
- **THEN** the panel closes, and the show's details list every episode of that season

#### Scenario: A season with no episodes
- **WHEN** the user picks a show's season and the lookup finds no episodes for it
- **THEN** the panel offers Create New Show, and clicking it opens the Create New Show dialog
