# Spec Delta

## ADDED Requirements

### Requirement: A specials season is listed as Specials
In the Add TV Show search results, a season numbered 0 SHALL be labelled "Specials" in place of "Season 0". Other seasons SHALL keep their "Season N" label.

#### Scenario: A stored show with specials
- **WHEN** the owner searches for a show stored with seasons 1 and 0
- **THEN** the results label its seasons "Season 1" and "Specials"
