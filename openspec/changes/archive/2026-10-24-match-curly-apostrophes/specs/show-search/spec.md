# Spec Delta

## MODIFIED Requirements

### Requirement: The same season means the same name and nearly the same year
Two entries SHALL count as the same season only when they share the "Title, Season N" collection name and their years are at most one apart. Names SHALL match ignoring case and treating curly single quotes (’ and ‘) as a straight apostrophe ('). The same rule SHALL decide when an entry is the same show as one in the database. Same-named shows further apart in years SHALL all keep their seasons, and a show that Apple and TMDB date a year apart SHALL stay one show.

#### Scenario: Same-named shows from different years are both kept
- **WHEN** TMDB returns the UK "The Office" (2001) and the US "The Office" (2005)
- **THEN** "The Office, Season 1" appears twice, once for each show with its own year and TMDB id, the 2001 show first

#### Scenario: Apple and TMDB a year apart are one show
- **WHEN** TMDB returns the UK "The Office" as 2001 and Apple returns it as 2002
- **THEN** "The Office, Season 1" and "Season 2" each appear once, from Apple

#### Scenario: Same name and year is still one season
- **WHEN** TMDB returns two shows named "The Office" that both started in 2005
- **THEN** each "The Office, Season N" appears once, from the show TMDB listed first, even if the second show's details arrive first

#### Scenario: Curly and straight apostrophes are the same name
- **WHEN** Apple returns "Lupin’s Tales" (2020) seasons 1 and 2 and TMDB returns "Lupin's Tales" (2021) seasons 1 and 2
- **THEN** "Lupin’s Tales, Season 1" and "Season 2" each appear once, from Apple, with Apple's spelling

#### Scenario: Apostrophe style does not hide a show in the database
- **WHEN** the database has "Lupin's Tales" (2021) with TMDB id 129874 and season 1, and Apple returns "Lupin’s Tales" (2020) seasons 1 and 2
- **THEN** the result is the database's season 1 and no Apple entries
