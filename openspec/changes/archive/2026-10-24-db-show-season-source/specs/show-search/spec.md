# Spec Delta

## ADDED Requirements

### Requirement: A show in the database takes extra seasons only from its own source
When an Apple or TMDB entry has the same title (ignoring case) as a database show and their years are at most one apart, the search SHALL keep that entry only if its show id equals the database show's id and the database has no season with its number. All other entries for that show SHALL be dropped, with no fallback to another source, so adding a season never creates a second row for a show already in the database.

#### Scenario: Database show from TMDB gets TMDB's next season
- **WHEN** the database has "Lupin" (2021) with TMDB id 96677 and seasons 1 and 2, Apple returns Lupin seasons 1 to 3, and TMDB returns Lupin 96677 seasons 1 to 3
- **THEN** the result is the database's seasons 1 and 2 and TMDB's season 3, with no Apple entries

#### Scenario: Database show from Apple gets Apple's next season
- **WHEN** the database has "Lupin" with Apple id `umc.cmc.lupin` and season 1, and Apple and TMDB both return Lupin seasons 1 and 2
- **THEN** the result is the database's season 1 and Apple's season 2, with no TMDB entries

#### Scenario: Other source's extra season is dropped
- **WHEN** the database has "Lupin" with TMDB id 96677 and seasons 1 and 2, TMDB returns seasons 1 and 2, and Apple returns seasons 1 to 4
- **THEN** the result is only the database's seasons 1 and 2

#### Scenario: No source returns the database show's id
- **WHEN** the database has "Lupin" stored with an id neither Apple nor TMDB returns, and both return Lupin seasons 1 to 3
- **THEN** the result is only the database's seasons

#### Scenario: Same-named show from other years is unaffected
- **WHEN** the database has "The Office" (2001) and Apple returns "The Office" (2005) season 1
- **THEN** the result has the database's 2001 season and Apple's 2005 season 1
