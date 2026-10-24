# Spec Delta

## Purpose

Lets the owner of a show edit it from its details drawer: its episodes, its active season and the show itself, its poster, which season it opens on, and creating a new show by hand when a search doesn't find it.

## ADDED Requirements

### Requirement: The edit link opens the edit dialog
In the details drawer of a show in their own collection, the signed-in user SHALL see an edit link. Clicking it SHALL open the edit dialog on the first episode of the show's active season, with Details, Artwork, Season and Sorting tabs. The page SHALL NOT navigate.

#### Scenario: Opening the dialog
- **WHEN** the owner opens a show's drawer and clicks its edit link
- **THEN** the edit dialog opens on the Details tab with the active season's first episode, and the page stays where it is

### Requirement: Switching tabs does not save
Switching between the dialog's tabs SHALL NOT send anything to the server. Edits made on any tab SHALL be kept until the dialog saves or closes.

#### Scenario: Edit, switch tabs, cancel
- **WHEN** the owner changes the episode's title, switches to the Sorting tab, then presses Cancel
- **THEN** no save was sent, and reopening the dialog shows the episode's stored title

### Requirement: OK saves every tab and closes once saved
OK SHALL save the episode, season and show fields from all four tabs in one request. The dialog SHALL close only when the save succeeds, and the drawer SHALL then show the saved details.

#### Scenario: Saving a rename
- **WHEN** the owner changes the show's title on the Sorting tab and presses OK
- **THEN** the dialog closes and the drawer shows the new title

### Requirement: A failed save is reported in the dialog
When a save fails, the dialog SHALL stay open with every field as typed and show a line reading "Couldn't save <show title>. Try again.", with the show's title shown as text. Each new attempt SHALL hide the line until it fails again.

#### Scenario: The server refuses the save
- **WHEN** the owner presses OK and the save answers with an error
- **THEN** the dialog stays open, the fields keep what was typed, and the error line names the show

### Requirement: Cancel closes without saving
Cancel SHALL close the dialog without sending anything. Saves already made by the arrows SHALL stay saved.

#### Scenario: Cancelling an edit
- **WHEN** the owner changes the episode's plot and presses Cancel
- **THEN** the dialog closes and the episode's stored plot is unchanged

### Requirement: The arrows save, then move to the next or previous episode
The arrows SHALL save all four tabs, then show the next or previous episode of the season in the dialog, which stays open. An arrow SHALL be disabled where there is no episode to move to. A failed save SHALL show the error line and keep the current episode.

#### Scenario: Moving to the next episode
- **WHEN** the owner edits the first episode's title and presses the right arrow
- **THEN** the dialog shows the second episode, and the first episode's new title is stored

#### Scenario: No previous episode
- **WHEN** the dialog shows the season's first episode
- **THEN** the left arrow is disabled

### Requirement: Delete Episode removes the episode shown
Delete Episode SHALL delete the episode shown, without asking, then show the next episode, or the previous one when the last was deleted. The footer SHALL show the signed-in user's show and episode counts. A failed delete SHALL show "Couldn't delete <episode title>. Try again." and change nothing.

#### Scenario: Deleting an episode
- **WHEN** the owner deletes the first of a season's three episodes
- **THEN** the dialog shows the second episode and the footer's episode count is one lower

#### Scenario: The delete fails
- **WHEN** the delete answers with an error
- **THEN** the dialog still shows the episode and the error line names it

### Requirement: The poster previews in the dialog and updates the page once saved
Changing the poster field, by typing a URL or by an upload, SHALL update the dialog's own poster images at once and nothing else. When a save succeeds, the drawer and the show's tile in the grid SHALL show the saved poster, the tile at the grid's thumbnail size. Cancel SHALL leave the page's posters unchanged.

#### Scenario: Saving a new poster
- **WHEN** the owner pastes a new poster URL on the Artwork tab and presses OK
- **THEN** the drawer and the show's grid tile show the new poster without a reload

#### Scenario: Cancelling a new poster
- **WHEN** the owner pastes a new poster URL, sees it in the dialog, and presses Cancel
- **THEN** the drawer and the grid tile still show the old poster

### Requirement: A season button sets the show's default season
In the drawer, each of the show's seasons SHALL have a button. Clicking one SHALL make that season the one the show opens on, show its details and episodes in the drawer, and put its poster on the show's grid tile at thumbnail size. The page SHALL NOT navigate.

#### Scenario: Choosing season 2
- **WHEN** the owner clicks season 2 in a show's drawer, then reloads and opens the show
- **THEN** the drawer shows season 2's episodes, and the tile shows season 2's poster

### Requirement: Create New Show adds a show by hand
Create New Show SHALL open the dialog with Show, Season and Episode tabs for the signed-in user. "+" SHALL add the episode on the Episode tab, refresh the collection grid, show a blank episode form, and report the episodes added to the season. OK SHALL do the same with a titled episode and then close; with no episode title it SHALL just close.

#### Scenario: Adding two episodes
- **WHEN** the owner fills in the show, season and an episode, presses "+", fills in a second episode and presses OK
- **THEN** the dialog closes, and the new show is in the grid with both episodes

#### Scenario: OK after "+"
- **WHEN** the owner presses "+" and then OK with the blank episode form
- **THEN** the dialog closes and no untitled episode is added
