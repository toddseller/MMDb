# Spec Delta

## ADDED Requirements

### Requirement: The open panel leaves the first row reachable
Where the search band is pinned to the top of the window, the page SHALL make room for the open panel, so that scrolled to the top, the collection's first row shows whole below the panel and can be clicked. Opening or closing the panel while the owner is scrolled down the collection SHALL NOT move the posters on screen. At the top of the page the posters MAY move down and up with the panel. Where the band scrolls with the page (phones and short windows), the page SHALL behave as before.

#### Scenario: First row with the panel open
- **WHEN** the owner, in a 1500px wide window, searches for a movie and the results show
- **THEN** the first row of posters is wholly below the panel, and clicking its second poster opens that movie's details and closes the panel

#### Scenario: Opening the panel scrolled down
- **WHEN** the owner is scrolled down to the fourth row of posters and searches for a movie
- **THEN** the posters on screen stay where they were while the panel opens and its results show

#### Scenario: Dismissing the panel scrolled down
- **WHEN** the owner, scrolled down with the panel open, dismisses it
- **THEN** the posters on screen stay where they were

#### Scenario: Scrolling up to the first row
- **WHEN** the owner opens the panel while scrolled down, then scrolls to the top of the page
- **THEN** the first row of posters shows whole below the open panel

#### Scenario: Phone
- **WHEN** an owner on a 390px wide phone searches for a movie
- **THEN** the panel pushes the posters down, as before, and the page gains no other room
