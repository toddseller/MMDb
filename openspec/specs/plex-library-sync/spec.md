# plex-library-sync Specification

## Purpose

Links the owner's MMDb movies and shows to the owner's Plex items, and keeps the owner's movies in line with Plex when the owner fixes a wrong Plex match after the movie was imported, and retries recent episodes the webhook import missed.

## Requirements

### Requirement: The backfill links stored titles to Plex items by name and year
The backfill SHALL give each movie and show in the owner's collection that has no Plex ID the ID of the owner's Plex item with the same name and a year within one. A Plex item SHALL be linked to at most one entry, and an entry with more than one candidate SHALL stay unlinked.

#### Scenario: Name and year agree
- **WHEN** Plex has "Get Carter" (1971) as item 134221 and the owner's collection has an unlinked Get Carter (1971)
- **THEN** that movie's Plex ID is 134221

#### Scenario: Show dated a year apart
- **WHEN** Plex has a show "Matlock" (2025) and the owner's collection has an unlinked Matlock (2024)
- **THEN** that show is linked to the Plex item

#### Scenario: Already linked
- **WHEN** a movie already has a Plex ID
- **THEN** the backfill leaves its ID as it is

### Requirement: The backfill links a lone same-name movie whatever its year
When no movie in the owner's collection has a Plex movie's name and a year within one, and exactly one unlinked movie there has its name, the backfill SHALL link that movie to the Plex item.

#### Scenario: Wrong match from before the change
- **WHEN** Plex has "Madden" (2026) as item 134511 and the owner's only Madden is Madden (2023), unlinked
- **THEN** Madden (2023) has Plex ID 134511

#### Scenario: Two namesakes
- **WHEN** Plex has "Halloween" (2007) and the owner's collection has unlinked Halloween (1978) and Halloween (2018)
- **THEN** neither is linked to that Plex item

### Requirement: The backfill reports what it could not match cleanly
The backfill SHALL print every Plex item it left unlinked and every movie it linked despite a year gap of more than one, with title and years, and SHALL NOT change any title, year or collection.

#### Scenario: Report lines
- **WHEN** the backfill links Madden (2023) to Plex's Madden (2026) and finds no entry named "The X Files"
- **THEN** its output lists both, and the owner's collection still has Madden (2023)

### Requirement: The correction pass replaces a movie whose Plex match changed
For each movie added to the owner's Plex movie library in the last 7 days, the pass SHALL compare Plex's current title and year with the owner's movie linked to that Plex item. When the name differs or the years are more than one apart, the pass SHALL import the movie Plex now names, with the same search and matching rules as a webhook import, and link it to the Plex item.

#### Scenario: Match fixed after import
- **WHEN** the owner's Madden (2023) is linked to Plex item 134511, added this week, and Plex now lists 134511 as Madden (2026)
- **THEN** after the pass the owner's collection has Madden (2026) linked to 134511

#### Scenario: Title changed by the fix
- **WHEN** the owner's "The Thing Called Love" (1993) is linked to a Plex item added this week that Plex now lists as "The Thing" (1982)
- **THEN** after the pass the owner's collection has The Thing (1982) linked to that item

#### Scenario: Plex agrees
- **WHEN** the linked movie's name and year match Plex's
- **THEN** the pass changes nothing for it

#### Scenario: Older addition
- **WHEN** a mismatched Plex item was added eight days ago
- **THEN** the pass ignores it

### Requirement: The correction pass removes the replaced movie
Once the right movie is in the owner's collection and linked, the pass SHALL remove the replaced movie from the owner's collection and clear its Plex ID. The movie row SHALL stay, as when the owner removes a movie. When the right movie could not be imported, the replaced movie SHALL stay as it is.

#### Scenario: Replacement found
- **WHEN** the pass has added Madden (2026) for Plex item 134511
- **THEN** Madden (2023) is no longer in the owner's collection, has no Plex ID, and its row still exists

#### Scenario: Search finds nothing
- **WHEN** Plex lists 134511 as Madden (2026) and the search lists no Madden (2026)
- **THEN** Madden (2023) stays in the owner's collection, linked to 134511

### Requirement: The correction pass imports a recent Plex movie with no linked entry
When no movie is linked to a Plex movie added in the last 7 days, the pass SHALL import it as a webhook import would and link it.

#### Scenario: Webhook missed
- **WHEN** Plex added "Plan 9 from Outer Space" (1957) this week and no movie is linked to it
- **THEN** after the pass the owner's collection has it, linked to that Plex item

### Requirement: The correction pass reports what it changed
The pass SHALL print one line for each movie it imports and each movie it removes, naming the title and year, and SHALL print nothing when it changes nothing.

#### Scenario: A correction
- **WHEN** the pass replaces Madden (2023) with Madden (2026)
- **THEN** its output names Madden (2026) as added and Madden (2023) as removed

### Requirement: Nothing changes when Plex can't be read
When the list of Plex items can't be fetched, the backfill and the pass SHALL fail with an error and SHALL NOT change any movie, show or collection.

#### Scenario: Tautulli unreachable
- **WHEN** the request for recent Plex movies times out
- **THEN** the pass exits with an error and nothing is changed

### Requirement: The correction pass runs every hour
The server SHALL run the correction pass every hour without a login, and the pass SHALL also be runnable by hand.

#### Scenario: Fix made between runs
- **WHEN** the owner fixes a Plex match at 04:45
- **THEN** the owner's collection shows the fixed movie by the end of the next hourly run

### Requirement: The pass retries recent episodes MMDb doesn't have
For each episode added to the owner's Plex show library in the last 7 days, the pass SHALL check whether the show linked to the episode's Plex show (or, when none is linked, the owner's only show of that name) has that season and episode. When it doesn't, the pass SHALL run the webhook's single-episode import for it, with the episode's IDs from Plex.

#### Scenario: Show not found at first
- **WHEN** Plex added The Good Daughter S1E1 two hours ago, MMDb has no such episode, and the show search now finds the show
- **THEN** after the pass the owner's The Good Daughter has S1E1

#### Scenario: Source didn't list the episode yet
- **WHEN** Plex added Best Medicine S2E8 this morning, the owner's Best Medicine has S2 without E8, and Apple now lists E8
- **THEN** after the pass the owner's Best Medicine S2 has E8

#### Scenario: Episode present
- **WHEN** Plex added Rivals S2E10 today and the owner's Rivals linked to that Plex show has S2E10
- **THEN** the pass doesn't import it again

#### Scenario: Older episode
- **WHEN** an episode added to Plex eight days ago is missing from MMDb
- **THEN** the pass ignores it

### Requirement: The pass reports episodes it added and episodes still missing
The pass SHALL print one line for each episode it adds and one for each recent episode still missing after its import, naming the show, season and episode.

#### Scenario: Still missing
- **WHEN** the pass retries Best Medicine S2E8 and the source still doesn't list it
- **THEN** its output names Best Medicine S2E8 as still missing, and the next hourly run tries again
