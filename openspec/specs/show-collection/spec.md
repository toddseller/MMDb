# show-collection Specification

## Purpose

Defines how a user's TV show collection grid is loaded and rendered: how much database work one page load may cost, what each tile shows, and how the poster images are fetched.

## Requirements

### Requirement: Collection grid load cost is independent of collection size
Loading a user's show collection grid SHALL issue the same number of database queries whether the user owns a few shows or several hundred. This applies to every response that renders the grid: viewing the collection, adding a show, and adding episodes.

#### Scenario: Larger collection, same query count
- **WHEN** the collection page is requested for a user with 2 shows and again for a user with 10 shows, each show having several seasons
- **THEN** both requests issue the same number of database queries

#### Scenario: Grid rendered after adding episodes
- **WHEN** a user with 2 shows and a user with 10 shows each add the same episode to a season, and the response re-renders their show grid
- **THEN** both requests issue the same number of database queries

### Requirement: Collection grid does not load data it does not display
Loading the collection grid SHALL NOT read episode records or the user's movie records. Whether the user has any movies SHALL be determined without loading them.

#### Scenario: No episode rows read
- **WHEN** the collection page is requested for a user whose shows have episodes
- **THEN** no query selects episode rows (aggregate counts are allowed)

#### Scenario: Movies link for a visitor
- **WHEN** a visitor views another user's show collection and that user owns at least one movie
- **THEN** the page shows the link to that user's movies, without loading the movie records

### Requirement: Season label is unchanged
Each tile SHALL show the same season label as before this change, derived from the show's seasons in season order. A season 0 (specials) SHALL be left out of the label, and a show whose only season is 0 SHALL read "Specials".

#### Scenario: Single season
- **WHEN** a show has one season, numbered 2
- **THEN** the tile reads "Season 2"

#### Scenario: Two to four seasons
- **WHEN** a show has seasons 1 and 3
- **THEN** the tile reads "Seasons 1, 3"

#### Scenario: Three consecutive seasons
- **WHEN** a show has seasons 1, 2 and 3
- **THEN** the tile reads "Seasons 1–3"

#### Scenario: Five or more seasons
- **WHEN** a show has 7 seasons
- **THEN** the tile reads "7 seasons"

#### Scenario: Specials left out
- **WHEN** a show has seasons 1 to 14 and a season 0
- **THEN** the tile reads "14 seasons"

#### Scenario: Specials beside one season
- **WHEN** a show has season 3 and a season 0
- **THEN** the tile reads "Season 3"

#### Scenario: Only specials
- **WHEN** a show's only season is 0
- **THEN** the tile reads "Specials"

### Requirement: Grid posters load lazily
Show posters in the collection grid SHALL be marked for deferred loading so that the browser fetches only the posters near the viewport.

#### Scenario: Poster marked lazy
- **WHEN** the collection grid is rendered, including after adding episodes or a show
- **THEN** every poster image in it carries `loading="lazy"` and a `src`, and none depends on a script-based lazy loader

### Requirement: Grid posters use thumbnail-sized images
The collection grid SHALL request a thumbnail-sized poster when the image host supports sizing in the URL, and the full-size URL otherwise. The stored poster URL SHALL NOT change.

#### Scenario: Apple TV artwork
- **WHEN** a show's poster URL ends in `600x600.jpg`
- **THEN** the grid requests the same URL ending in `400x400.jpg`

#### Scenario: Other hosts
- **WHEN** a show's poster URL does not end in `600x600.jpg` (for example a `cdn.myflix.stream` image, a TheTVDB image or the default artwork)
- **THEN** the grid requests the URL unchanged

#### Scenario: Stored value untouched
- **WHEN** the grid renders a thumbnail URL
- **THEN** the show's stored poster, and the poster shown in the show detail view and returned by the APIs, remain the full-size URL

### Requirement: Show lists return the same order every time
Every show list SHALL return its shows in an order fixed by the stored data, so repeating a request gives the same order and pages never overlap or skip. Collection lists sort by sort name, then year, then oldest record first. Recently added sorts newest first, newest record first when added at the same moment.

#### Scenario: Same sort name and year
- **WHEN** a user owns two shows with the same title and year, and their collection or an API list of it is requested
- **THEN** the show added first comes first, on every request

#### Scenario: Added at the same moment
- **WHEN** the recently added shows are requested and two were created with the same timestamp
- **THEN** the one added last comes first, on every request

### Requirement: A show's season count and numbers leave out specials
The season count and season numbers the API reports for a show, in the v2 show list and in the v2 and v3 add-show replies, SHALL leave out season 0, matching the tile.

#### Scenario: Adding a season to a show with specials
- **WHEN** season 14 is added through the API to a show with seasons 1 to 13 and a season 0
- **THEN** the reply's `seasonCount` and `seasonNumbers` are both 14

#### Scenario: A show stored before this change
- **WHEN** the v2 show list is requested after deploy, for a show that already had a season 0
- **THEN** that show's `seasonCount` leaves season 0 out
