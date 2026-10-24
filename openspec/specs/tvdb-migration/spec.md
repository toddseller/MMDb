# tvdb-migration Specification

## Purpose

Moves shows and seasons stored with TVDB ids onto Apple or TMDB ids, so that each show's seasons come from one source search still uses. Every change goes through a plan that a person reviews before it's applied.

## Requirements

### Requirement: A show's TVDB id comes from its seasons
The dry run SHALL consider every show with at least one season whose collection id starts with `tvdb`. It SHALL take the show's TVDB id from those seasons, using the collection id minus the `tvdb` prefix and the season-number suffix and choosing the most common value. It SHALL find the TMDB show for that TVDB id through TMDB's TVDB-id lookup.

#### Scenario: Show id already changed
- **WHEN** a show's id is TMDB's `71914` but its seasons 1 and 2 have collection ids `tvdb3557301` and `tvdb3557302`
- **THEN** the dry run uses TVDB id `355730` to find the show on TMDB

#### Scenario: One season has a wrong collection id
- **WHEN** seasons 1, 3 and 4 have `tvdb791671`, `tvdb791673` and `tvdb791674`, and season 2 also has `tvdb791671`
- **THEN** the TVDB id is `79167`, and season 2 is converted like the others

### Requirement: Every season of a show comes from one source
The plan SHALL route each show one of three ways:
- An Apple show (its id is an Apple id) whose every stored season number Apple returns SHALL stay Apple, and its TVDB seasons SHALL become Apple seasons.
- An Apple show that Apple can't fully cover SHALL move entirely to TMDB.
- Any other show SHALL move to TMDB.

A move to TMDB SHALL apply only when TMDB has every stored season number.

#### Scenario: Apple covers every season
- **WHEN** Westworld has Apple seasons 1 to 3 and TVDB season 4, and Apple returns seasons 1 to 4
- **THEN** the plan makes season 4 an Apple season and leaves the show's id and seasons 1 to 3 unchanged

#### Scenario: Apple lacks a season
- **WHEN** Fraggle Rock has Apple seasons 1 to 4 and TVDB season 5, Apple returns seasons 1 to 4, and TMDB has seasons 1 to 5
- **THEN** the plan moves the show and all five seasons to TMDB

#### Scenario: Apple doesn't recognize the show
- **WHEN** Apple returns nothing for an Apple show's id in every storefront, and TMDB has all its seasons
- **THEN** the plan moves the show and all its seasons to TMDB

#### Scenario: All-TVDB show
- **WHEN** a show's id and every season are TVDB, and TMDB has all its season numbers
- **THEN** the plan sets the show's id to the TMDB id and makes every season a TMDB season

### Requirement: Only ids and episode routing change
A season moved to TMDB SHALL get the collection id `tmdb<TMDB id><season number>` and SHALL have its Apple id, skip and store id cleared. A season moved to Apple SHALL get Apple's season id, show id, skip, episode count and store id. A show moved to TMDB SHALL get the TMDB id. Titles, collection names, posters, plots and episodes SHALL NOT change.

#### Scenario: TVDB season already routed to Apple
- **WHEN** a TVDB season moving to TMDB has a skip and an Apple id set
- **THEN** both are cleared, so its episodes come from TMDB

#### Scenario: Artwork kept
- **WHEN** a season with a custom poster moves to TMDB or Apple
- **THEN** its poster is unchanged

### Requirement: Shows that can't be resolved are reported and left unchanged
The plan SHALL list, and leave unchanged, every show that has no single TMDB match, that TMDB can't fully cover when it must move to TMDB, or whose show id is neither its TVDB id, a TMDB id, nor an Apple id. It SHALL also list TVDB seasons whose show no longer exists.

#### Scenario: No TMDB match
- **WHEN** TMDB's lookup returns no show for a TVDB id
- **THEN** the plan lists that show as unresolved, and the apply step changes none of its rows

### Requirement: A plan never creates duplicate ids
The dry run SHALL refuse to write a plan in which a planned collection id belongs to another season, or a planned show id belongs to another show, whether already stored or planned in the same run. It SHALL name each collision.

#### Scenario: Show already added from TMDB
- **WHEN** a TVDB show maps to TMDB id 12345 and another stored show already has id 12345
- **THEN** no plan is written and the output names both shows

### Requirement: The dry run writes a reviewable plan and no data
The dry run SHALL write a plan file listing, for each show, its route and each changed field with its current and new value, followed by the unresolved items and totals. It SHALL NOT write to the database.

#### Scenario: Dry run leaves the database alone
- **WHEN** the dry run finishes
- **THEN** no show or season row has changed, and the plan file exists

### Requirement: Apply makes exactly the reviewed plan's changes
The apply step SHALL read only the plan file and SHALL NOT call any outside service. It SHALL make every planned change in one transaction. It SHALL first check that each row's current values still equal the plan's recorded values, and if any differs, it SHALL change nothing and name the row.

#### Scenario: Plan applied
- **WHEN** the apply step runs on an unchanged database with a plan from the dry run
- **THEN** every planned change is made, and running the dry run again finds no TVDB seasons except those listed as unresolved

#### Scenario: Data changed after the dry run
- **WHEN** a season in the plan was edited after the dry run
- **THEN** the apply step changes nothing and names that season

#### Scenario: No network during apply
- **WHEN** the apply step runs with every outside request blocked
- **THEN** it completes the plan's changes
