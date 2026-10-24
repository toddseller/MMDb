# Spec Delta

## ADDED Requirements

### Requirement: Enter in a field acts as OK
Pressing Enter in a single-line field of the edit dialog or the Create New Show dialog SHALL do what OK does, and the page SHALL NOT navigate. Enter in a multi-line field SHALL add a new line.

#### Scenario: Enter saves the edit
- **WHEN** the owner changes the episode number on the Details tab and presses Enter in that field
- **THEN** the dialog closes, the drawer shows the saved details, and the page is still the collection

#### Scenario: Enter adds the episode in Create New Show
- **WHEN** the owner fills in a new show, its season and a titled episode, and presses Enter in a single-line field
- **THEN** the dialog closes and the new show is in the grid with that episode

#### Scenario: A failed save on Enter
- **WHEN** the owner presses Enter in a field and the save answers with an error
- **THEN** the dialog stays open, the fields keep what was typed, and the error line names the show

### Requirement: Each tab shows its own panel
Clicking a tab in the edit or Create New Show dialog SHALL show that tab's panel, hide the others and mark that tab as the current one.

#### Scenario: Switching to Artwork
- **WHEN** the owner opens the edit dialog and clicks the Artwork tab
- **THEN** the Artwork panel with its Upload control is shown, the Details panel is hidden, and Artwork is the highlighted tab
