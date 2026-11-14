# weekly-newsletter Specification

## Purpose

A weekly email, sent in place of Tautulli's newsletter, that lists the movies and TV added to Plex each week. Each title shows its poster and links into Plex. Readers can unsubscribe, and each issue can also be read in a browser at myflix.stream.

## Requirements

### Requirement: An issue covers the week since the Sunday before last
An issue SHALL list every item Tautulli reports as added to Plex libraries 1 (movies) and 2 (TV) since 00:00 Pacific on the Sunday a week before the most recent Sunday, up to the run, and SHALL list nothing added earlier, whatever the number of items. A run that starts late SHALL still cover that whole week.

#### Scenario: Items on both sides of the window
- **WHEN** the Sunday 00:00 run finds one movie added two days ago and another added eight days ago
- **THEN** the issue lists the first movie and not the second

#### Scenario: More additions than Tautulli returns in one request
- **WHEN** 150 items were added in the week
- **THEN** the issue covers all 150

#### Scenario: A rerun on Monday
- **WHEN** Sunday's send fails and the run is repeated on Monday at 09:00
- **THEN** the issue still lists a movie added at 01:00 on the Sunday before last

### Requirement: Each show gets one card
TV additions SHALL be grouped into one card per show, whether Plex reports the show itself, its seasons or its episodes. The card SHALL say "New series" when the show itself was added. Otherwise it SHALL name the added seasons and count the added episodes, for example "Season 3" or "8 new episodes".

#### Scenario: Several episodes of one show
- **WHEN** eight episodes of Tulsa King were added this week
- **THEN** the issue has one Tulsa King card that says "8 new episodes"

#### Scenario: A whole season
- **WHEN** Plex reports Season 3 of The Rings of Power as one added item
- **THEN** the issue has one card for The Rings of Power that says "Season 3"

#### Scenario: A new show
- **WHEN** Plex reports MythBusters itself as added
- **THEN** the issue has one MythBusters card that says "New series"

### Requirement: Each movie gets its own card
Each movie added in the window SHALL get its own card with its title and year. The issue SHALL list movies and TV in separate sections, with the most recently added first in each.

#### Scenario: Two movies
- **WHEN** Get Carter was added after Primetime
- **THEN** the movies section shows Get Carter's card, then Primetime's

### Requirement: Cards show the TMDB poster of the movie or show
A card SHALL show the poster of its movie or show, loaded from TMDB's public image host and found through the item's TMDB ID. A show card SHALL use the show's poster, never a season's. A card whose title has no TMDB ID, or whose TMDB lookup fails, SHALL be sent without a poster rather than left out.

#### Scenario: A season card
- **WHEN** a card exists because Season 3 of a show was added
- **THEN** its poster is the show's TMDB poster

#### Scenario: No TMDB ID
- **WHEN** a movie in the window has no TMDB ID in Plex
- **THEN** its card appears without a poster

### Requirement: Cards link into Plex
Each card SHALL link to its movie or show in Plex's web app on this Plex server, so a reader can open the title with one click.

#### Scenario: Opening a show
- **WHEN** a reader clicks the Tulsa King card
- **THEN** Plex's web app opens Tulsa King's page on the server

### Requirement: Each subscriber gets their own copy, with an unsubscribe link
The issue SHALL be sent from `MYFLIX Newsletter <info@myflix.stream>` as one email per subscriber, addressed to that subscriber. Each email SHALL carry an unsubscribe link and the headers mail clients use for one-click unsubscribe. A subscriber who has unsubscribed SHALL receive no later issue.

#### Scenario: A reader unsubscribes
- **WHEN** a reader follows the unsubscribe link in one week's issue
- **THEN** the next week's issue is not sent to them, and still goes to everyone else

#### Scenario: Recipients don't see each other
- **WHEN** an issue goes to eight subscribers
- **THEN** each email's recipient line shows only that subscriber's address

### Requirement: Each issue can be read in a browser
Each issue SHALL be published as a web page at `https://myflix.stream/newsletter/` under a name made of the issue date and a random part that can't be guessed. The email SHALL link to it as "View in browser". The page SHALL show the issue as the email shows it, without the unsubscribe link, and SHALL keep doing so after later issues are sent.

#### Scenario: Opening last month's issue
- **WHEN** a reader opens the "View in browser" link from an issue sent a month ago
- **THEN** the page shows that issue's titles, not the current week's

#### Scenario: Guessing an address
- **WHEN** someone requests `https://myflix.stream/newsletter/` with a date but not the random part
- **THEN** no issue is shown

### Requirement: Regular issues rotate templates
Outside holiday windows, each issue SHALL use one of the regular templates, and when two or more regular templates exist, an issue SHALL NOT use the same template as the issue sent the week before, including across New Year. The email and its browser copy SHALL use the same template.

#### Scenario: Two regular templates
- **WHEN** two regular templates exist and the issue sent on one Sunday used the first
- **THEN** the next Sunday's issue uses the second

#### Scenario: Across New Year
- **WHEN** two regular templates exist and issues go out on the last Sunday of December and the first Sunday of January, both outside holiday windows
- **THEN** the two issues use different templates

#### Scenario: One regular template
- **WHEN** only one regular template exists
- **THEN** every issue outside holiday windows uses it

### Requirement: Holiday windows override the rotation
An issue whose run date falls inside a holiday window SHALL use that holiday's templates instead of the regular ones, rotating among them in the same way when a holiday has more than one. The Christmas window SHALL run from December 1 to December 26, inclusive.

#### Scenario: A December issue
- **WHEN** an issue runs on December 13
- **THEN** it uses the Christmas template

#### Scenario: Just after the window
- **WHEN** an issue runs on December 27
- **THEN** it uses a regular template

#### Scenario: Christmas Day on a Sunday
- **WHEN** an issue runs on December 25
- **THEN** it uses the Christmas template

### Requirement: A week with no additions sends nothing
When a run finds no additions in the window, it SHALL send no email and publish no page.

#### Scenario: A quiet week
- **WHEN** nothing was added to either library during the week
- **THEN** subscribers get no email that week, and no new issue page exists

### Requirement: A failed publish sends nothing
When the browser copy can't be saved, the run SHALL fail without sending, so no email links to a page that doesn't exist.

#### Scenario: The issues folder can't be written
- **WHEN** the run can't save the issue page
- **THEN** no email is sent and the run reports the failure

### Requirement: The issue goes out every Sunday at midnight Pacific time
The production server SHALL start a run every Sunday at 00:00 Pacific time (America/Los_Angeles), in both standard and daylight time, whatever the server's own timezone. The run date used for holiday windows and the issue's date SHALL be the Pacific date. Each run SHALL use the newsletter code the server has checked out at that time.

#### Scenario: Winter and summer
- **WHEN** one run falls in January and another in July
- **THEN** both start at 00:00 Pacific, which is 08:00 UTC in January and 07:00 UTC in July

#### Scenario: The run date
- **WHEN** a run starts at 00:00 Pacific on Sunday, December 27
- **THEN** its issue is dated December 27, and it uses a regular template, not the Christmas one

#### Scenario: A release on Saturday
- **WHEN** a change to the email's layout is deployed on Saturday
- **THEN** Sunday's issue uses the new layout
