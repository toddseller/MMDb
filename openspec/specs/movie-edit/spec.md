# movie-edit Specification

## Purpose
Defines editing a movie from its details drawer: opening the edit form, saving and deleting, refreshing its details from a search, its quality and New flags, and rating it.

## Requirements

### Requirement: The edit link opens the form in the drawer
Clicking the edit link in a movie's details SHALL replace the drawer's details with the movie's edit form. Nothing else on the page SHALL receive the form, and an open search panel SHALL close. The page SHALL NOT navigate.

#### Scenario: Opening the edit form
- **WHEN** the user clicks the edit link in a movie's details
- **THEN** the drawer shows the edit form with the movie's values, and the page holds exactly one edit form

### Requirement: Saving redraws the collection and reopens the movie
Submitting the edit form, by Update or by Enter in a field, SHALL save the movie without navigating. The grid SHALL then be redrawn with the list currently shown, and the drawer SHALL reopen at once on the movie's poster, showing its updated details.

#### Scenario: Saving a change
- **WHEN** the user changes a movie's plot and clicks Update
- **THEN** the drawer shows the movie's details with the new plot, and they are still there after a reload

#### Scenario: Saving while the title filter is on
- **WHEN** the collection is filtered by title and the user saves a movie that matches
- **THEN** the grid is redrawn with the same filtered list

### Requirement: Deleting removes the movie once the server confirms
Clicking Delete in the edit form SHALL remove the movie from the user's collection. Once the server confirms, the drawer SHALL close and the grid SHALL be redrawn with the list currently shown, with the footer showing the new movie count. The drawer SHALL stay open until then.

#### Scenario: Deleting a movie
- **WHEN** the user clicks Delete in a movie's edit form
- **THEN** the drawer closes, the movie's poster is gone, and the footer shows one movie fewer

#### Scenario: Deleting while the title filter is on
- **WHEN** the collection is filtered by title and the user deletes a movie that matches
- **THEN** the grid shows the same filtered list without that movie

### Requirement: A failed save or delete says so in the form
When saving or deleting fails, the edit form SHALL show a line under its buttons naming the movie and the action that failed. The drawer SHALL stay open on the form, with the user's edits kept, and the grid SHALL be left unchanged. The line SHALL show the title as text.

#### Scenario: Saving fails
- **WHEN** the server answers a save with an error
- **THEN** the form shows that the movie couldn't be saved, keeps the edits, and the grid is unchanged

#### Scenario: Deleting fails
- **WHEN** the server answers a delete with an error
- **THEN** the form shows that the movie couldn't be deleted, the drawer stays open, and the movie's poster is still in the grid

### Requirement: The form's search looks up the movie as stored
The edit form's Search SHALL look up the movie's stored title in the movie database and show the matches in the search panel, whatever has been typed in the title field. This lets a movie added without full details be refreshed from the database.

#### Scenario: Searching from the form
- **WHEN** the user edits the title field and then clicks Search
- **THEN** the search panel shows the matches for the title the movie was stored with

### Requirement: Picking a search result refreshes the movie
Picking a result from the edit form's search SHALL save that result's details to the movie, close the search panel, and show the edit form again with the saved values. If saving fails, the panel SHALL stay open and the form SHALL show that the movie couldn't be saved.

#### Scenario: Picking a result
- **WHEN** the user picks a result from the edit form's search
- **THEN** the panel closes and the form shows the result's details

### Requirement: At most one video quality is checked
The edit form's 4K, 1080 and 720 checkboxes SHALL allow at most one to be checked: checking one SHALL uncheck the others. Unchecking the checked one SHALL leave none checked, which saves the movie as standard definition.

#### Scenario: Switching quality
- **WHEN** a movie's form has 1080 checked and the user checks 4K
- **THEN** 4K is checked and 1080 and 720 are not

### Requirement: Saving keeps the New mark
Saving a movie marked New, without unchecking New, SHALL keep it marked New, for every user.

#### Scenario: Saving a New movie
- **WHEN** a user who isn't the library owner saves a movie marked New without touching New
- **THEN** the movie is still marked New when its form is opened again

### Requirement: Clicking a star rates the movie
Clicking a star in a movie's details SHALL save the user's rating without navigating, show that star as checked, and replace the rating area with the saved result.

#### Scenario: Rating a movie
- **WHEN** the user clicks 4 stars in a movie's details
- **THEN** 4 stars is checked, and it is still checked when the details are reopened after a reload
