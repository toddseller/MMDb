# Spec Delta

## MODIFIED Requirements

### Requirement: Dismissing the panel restores the add button
Clicking the dismiss control SHALL slide the panel closed, hide its arrows and dismiss control, and put the add button back in place of the search box. Opening a poster's details SHALL do the same, whether the panel holds the add search's results or the edit form's.

#### Scenario: Dismissing results
- **WHEN** the user dismisses a panel of search results
- **THEN** the panel closes, and the add button is shown again with no search box

#### Scenario: Opening a poster while results show
- **WHEN** the panel shows search results and the user clicks a poster to open its details
- **THEN** the panel closes, the add button is shown again, and the poster's details open
