# adding-to-collection Specification

## Purpose

Defines how a collection's owner searches for a movie or show from the collection page, browses the results in the panel above the collection, and adds a movie, an episode or a whole season without leaving the page.

## Requirements

### Requirement: The add button opens a search for the collection's owner
On their own collection page, a signed-in user SHALL see an add button: Add Movie on the movies page, Add TV Show on the shows page. Clicking it SHALL replace the button with a search box. Nobody else SHALL see the add button.

#### Scenario: Opening the search
- **WHEN** a signed-in user clicks Add Movie on their own collection
- **THEN** the button is replaced by a movie title search box

### Requirement: A search shows its results in a panel above the collection
Submitting a search SHALL slide a panel open above the collection, showing a "Searching Our Database..." message, and clear the search box. When the results arrive, the panel SHALL show them as posters, centred when there are six or fewer. A dismiss control SHALL be shown while the panel is open. The page SHALL NOT navigate.

#### Scenario: Searching for a movie
- **WHEN** the user searches for a movie title
- **THEN** the panel opens with the searching message, then shows a poster for each result, and the page stays where it is

#### Scenario: A movie search fails
- **WHEN** the movie search request fails on the server
- **THEN** the panel shows a placeholder image instead of results

#### Scenario: A show search fails
- **WHEN** the show search request fails on the server
- **THEN** the panel offers a Create New Show button

### Requirement: Arrows scroll through more than six results
When the results don't fit across the panel, the panel SHALL show arrows for scrolling. Each arrow SHALL scroll by the panel's visible width. The right arrow SHALL show only while there are more results to the right, and the left arrow only while there are results to the left.

#### Scenario: Scrolling through results
- **WHEN** a search returns more results than fit across the panel
- **THEN** only the right arrow shows; clicking it scrolls the next panel's width of results into view and shows the left arrow; at the end of the results the right arrow hides

### Requirement: Dismissing the panel restores the add button
Clicking the dismiss control SHALL slide the panel closed, hide its arrows and dismiss control, and put the add button back in place of the search box. Opening a poster's details SHALL do the same, whether the panel holds the add search's results or the edit form's.

#### Scenario: Dismissing results
- **WHEN** the user dismisses a panel of search results
- **THEN** the panel closes, and the add button is shown again with no search box

#### Scenario: Opening a poster while results show
- **WHEN** the panel shows search results and the user clicks a poster to open its details
- **THEN** the panel closes, the add button is shown again, and the poster's details open

### Requirement: Picking a movie adds it to the collection
Picking a movie from the results SHALL show "Adding <title> to Your Collection..." in the panel and add the movie. The panel SHALL then close, the add button SHALL replace the search box, and the collection and its count SHALL update.

#### Scenario: Adding a movie
- **WHEN** the user picks a movie from the results
- **THEN** the panel shows the adding message, then closes, and the movie appears in the collection with the count raised by one

### Requirement: Picking a show's season leads to adding its episodes
Picking a show's season SHALL show the adding message, then list that season's episodes in the panel, with Add All Episodes. Picking an episode, or Add All Episodes, SHALL add it or them. The panel SHALL then close, the add button SHALL replace the search box, and the shows and their counts SHALL update.

#### Scenario: Adding a whole season
- **WHEN** the user picks a show's season, then Add All Episodes
- **THEN** the panel closes, and the show's details list every episode of that season

### Requirement: Adding messages show titles as written
The title in an adding message SHALL appear exactly as written, even when it contains characters such as `<` or `&`.

#### Scenario: A title with markup characters
- **WHEN** the user picks a result whose title contains `<i>`
- **THEN** the adding message shows `<i>` as text, and no element is created from it
