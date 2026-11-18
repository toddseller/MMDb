# Spec Delta

## ADDED Requirements

### Requirement: Re-adding a stored episode fills its blank fields
When an episode is added from the search panel, from Create New Show, or through `POST /add_episodes` in API v2 or v3, and the season already has an episode with that episode number, the stored episode SHALL take each incoming title, air date, plot, runtime and still only where its own value is blank; a runtime of `0 min` counts as blank. Values already stored, including hand edits, SHALL be kept. No second episode with that number SHALL be added. The Plex import is not covered here.

#### Scenario: A missing plot and runtime are filled
- **WHEN** a stored episode has no plot and no runtime, and the same episode is added again with a plot and a runtime of 42
- **THEN** the stored episode shows that plot and a runtime of `42 min`

#### Scenario: A runtime saved as 0 min is filled
- **WHEN** a stored episode was saved without a runtime and shows `0 min`, and the same episode is added again with a runtime of 42
- **THEN** the stored episode shows a runtime of `42 min`

#### Scenario: Stored values are kept
- **WHEN** a stored episode has a hand-edited title and plot, and the same episode is added again with a different title and plot
- **THEN** the stored episode keeps its hand-edited title and plot

#### Scenario: A blank incoming value changes nothing
- **WHEN** a stored episode has a plot, and the same episode is added again with an empty plot
- **THEN** the stored episode keeps its plot

#### Scenario: Add All Episodes over a partly stored season
- **WHEN** a season already has episodes 1 and 2, episode 2 without a plot, and Add All Episodes adds episodes 1 to 3
- **THEN** the season has exactly episodes 1, 2 and 3, and episode 2 has the incoming plot

#### Scenario: Re-adding through the API
- **WHEN** a stored episode has no runtime, and its owner posts the same episode with a runtime to `/add_episodes` in API v2 or v3
- **THEN** the stored episode has that runtime and the response lists it once
