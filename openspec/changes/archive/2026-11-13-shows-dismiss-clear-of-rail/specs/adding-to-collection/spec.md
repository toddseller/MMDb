## MODIFIED Requirements

### Requirement: Dismissing the panel restores the add button
Clicking the dismiss control SHALL slide the panel closed, hide its arrows and dismiss control, and put the add button back in place of the search box. Opening a poster's details SHALL do the same, whether the panel holds the add search's results or the edit form's. The dismiss control SHALL be clickable on every page that has the panel, SHALL NOT sit under the letter rail, and SHALL sit level with the search box on both the movies and shows pages.

#### Scenario: Dismissing results
- **WHEN** the user dismisses a panel of search results
- **THEN** the panel closes, and the add button is shown again with no search box

#### Scenario: Dismissing show results beside the letter rail
- **WHEN** the owner, on the shows page with the letter rail showing, searches for a show and clicks the dismiss control, either with the results showing or after picking a season
- **THEN** the panel closes, and Add TV Show is shown again with no search box

#### Scenario: The dismiss control sits in the same place on both pages
- **WHEN** the owner opens search results on the movies page and on the shows page
- **THEN** the dismiss control is level with the search box on each, though the movies page has a Library / Unwatched / 4K row above its panel

#### Scenario: Opening a poster while results show
- **WHEN** the panel shows search results and the user clicks a poster to open its details
- **THEN** the panel closes, the add button is shown again, and the poster's details open
