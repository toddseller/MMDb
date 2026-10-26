# Spec Delta

## ADDED Requirements

### Requirement: An open drawer stays open when episodes are added
When the owner adds episodes from the search panel while a show's drawer is open, that drawer SHALL stay open under the same show's poster, whichever show the episodes went to, and show that show's details as they are after the add. It SHALL stay on the season it was showing, appear with no moment where it is gone, and ease from its old height to its new one. The open poster SHALL stay where it was on screen, as far as the page can scroll.

#### Scenario: Adding missing episodes to the open show's season
- **WHEN** a show's drawer is open on a season, and the owner adds that season's missing episodes from the search panel
- **THEN** the drawer stays open under the show's poster and lists the new episodes, easing to its new height

#### Scenario: Adding episodes to another show
- **WHEN** a show's drawer is open, and the owner adds episodes to a different show
- **THEN** the drawer stays open under the first show's poster, showing that show's details

#### Scenario: Adding another season of the open show
- **WHEN** a show's drawer is open on one season, and the owner adds episodes of another season of the same show
- **THEN** the drawer stays open on the season it was showing, and the show's poster and active season are unchanged

#### Scenario: A new show lands above the open one
- **WHEN** a show's drawer is open, and the add creates a new show that sorts before it
- **THEN** the open poster stays where it was on screen, with the drawer below its row

#### Scenario: Reduced motion
- **WHEN** the user's system asks for reduced motion, and episodes are added with a drawer open
- **THEN** the drawer changes to its new height without animating

#### Scenario: The open show is no longer in the grid
- **WHEN** a show's drawer is open, and after the add that show's poster is missing from the redrawn grid or hidden in it
- **THEN** no drawer is open

#### Scenario: No drawer open
- **WHEN** no drawer is open, and the owner adds episodes
- **THEN** the shows and their counts update and no drawer opens, as before
