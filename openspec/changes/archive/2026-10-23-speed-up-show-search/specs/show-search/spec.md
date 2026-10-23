# Spec Delta

## Purpose

Defines how a title search builds the list of seasons a user can add: what the database, Apple TV and TMDB each contribute, which source wins when they overlap, and how many outside requests a search may make and in what order.

## ADDED Requirements

### Requirement: Sources merge with database, then Apple, then TMDB priority
A search SHALL return one entry per season from the matching database shows, Apple TV and TMDB, with the same fields as before this change. When two sources offer the same season, the database entry SHALL win over Apple and Apple over TMDB, whichever source answers first. The entries SHALL be sorted by year, title and season number.

#### Scenario: Apple wins over TMDB
- **WHEN** Apple and TMDB both return "Lupin, Season 1"
- **THEN** the result has one "Lupin, Season 1" entry, and it carries Apple's ids and poster

#### Scenario: Priority holds when TMDB answers first
- **WHEN** the TMDB responses arrive before the Apple responses
- **THEN** the result is the same as when Apple answers first

### Requirement: The same season means the same name and nearly the same year
Two entries SHALL count as the same season only when they share the "Title, Season N" collection name and their years are at most one apart. Same-named shows further apart in years SHALL all keep their seasons, and a show that Apple and TMDB date a year apart SHALL stay one show.

#### Scenario: Same-named shows from different years are both kept
- **WHEN** TMDB returns the UK "The Office" (2001) and the US "The Office" (2005)
- **THEN** "The Office, Season 1" appears twice, once for each show with its own year and TMDB id, the 2001 show first

#### Scenario: Apple and TMDB a year apart are one show
- **WHEN** TMDB returns the UK "The Office" as 2001 and Apple returns it as 2002
- **THEN** "The Office, Season 1" and "Season 2" each appear once, from Apple

#### Scenario: Same name and year is still one season
- **WHEN** TMDB returns two shows named "The Office" that both started in 2005
- **THEN** each "The Office, Season N" appears once, from the show TMDB listed first, even if the second show's details arrive first

### Requirement: Apple matches partial titles, ranked and capped
Apple TV SHALL contribute shows whose title contains the search term, ignoring case. It SHALL fetch at most 10 shows per search, ranked with exact title matches first, then titles starting with the term, then titles containing it, keeping Apple's order within each rank. Shows whose title does not contain the term SHALL be ignored.

#### Scenario: Partial title
- **WHEN** the user searches `the offi` and Apple's search returns "The Office", "The Office: Superfan Episodes" and "Parks and Recreation"
- **THEN** the result includes seasons of "The Office" and "The Office: Superfan Episodes" from Apple, and nothing from "Parks and Recreation"

#### Scenario: Cap keeps the exact match
- **WHEN** Apple returns 15 shows containing `lupin`, with "Lupin" listed last
- **THEN** Apple details are fetched for 10 shows, and "Lupin" is one of them

### Requirement: Each Apple show is fetched once
The system SHALL search the US, UK, CA and AU Apple storefronts and SHALL fetch each unique Apple show's details and seasons once, from the first storefront in that order whose search returned it.

#### Scenario: Show in several storefronts
- **WHEN** all four storefronts return the same show
- **THEN** its details and episodes are requested once, from the US storefront, and its entries carry the US store id

#### Scenario: Show only outside the US
- **WHEN** only the UK storefront returns a show
- **THEN** its details are fetched from the UK storefront and its entries carry the UK store id

### Requirement: TMDB keeps every first-page result in one request per show
TMDB SHALL contribute every show on the first page of its search results, without a cap or title filter. Each show's details, seasons (other than season 0) and content ratings SHALL be fetched in one request, plus one more request per further 19 seasons for shows with more than 19.

#### Scenario: Request count
- **WHEN** TMDB's search returns 20 shows of at most 19 seasons each
- **THEN** the search makes 21 TMDB requests: 1 search and 1 per show

#### Scenario: Long-running show
- **WHEN** a show has 25 seasons
- **THEN** its seasons come from 2 requests and all 25 appear in the result

### Requirement: Outside lookups run concurrently
The database-season checks, the Apple lookup and the TMDB lookup SHALL run at the same time, and each SHALL run its own requests several at a time, so a search takes about as long as its slowest chain of dependent requests rather than the sum of all of them. A failing or unreachable source SHALL leave the other sources' entries in the result.

#### Scenario: Slow responses overlap
- **WHEN** every outside response takes 0.5 seconds and a search needs 20 or more requests across a database-season check, Apple and TMDB
- **THEN** the search finishes in under 1.6 seconds, where running the sources one after another takes at least 2.5

#### Scenario: One source fails
- **WHEN** Apple answers every request with an error
- **THEN** the result still contains the database and TMDB entries

### Requirement: Existing callers keep working
The search page, the Plex webhook import and the v2 and v3 search endpoints SHALL receive results in the same shape as before, so their behavior changes only in which seasons are found.

#### Scenario: Webhook import
- **WHEN** Plex reports a new episode of a show that Apple returns under its exact title
- **THEN** the webhook imports that show's season as before
