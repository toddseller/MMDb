# Spec Delta

## Purpose

Defines how a user's TV show collection grid is loaded and rendered: how much database work one page load may cost, what each tile shows, and how the poster images are fetched.

## ADDED Requirements

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
Each tile SHALL show the same season label as before this change, derived from the show's seasons in season order.

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

### Requirement: Grid posters load lazily
Show posters in the collection grid SHALL be marked for deferred loading so that the browser fetches only the posters near the viewport.

#### Scenario: Poster marked lazy
- **WHEN** the collection grid is rendered
- **THEN** every poster image in it carries `loading="lazy"`, or is already deferred by the existing script-based lazy loader

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
