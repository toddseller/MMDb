# Spec Delta

## Purpose

Defines how movie grids load their posters: at a size that fits the tile, and only as they come near the screen, so large collections load quickly and stay responsive.

## ADDED Requirements

### Requirement: Movie grid posters use a tile-sized image from Apple
Every movie grid SHALL request Apple TV artwork at 348×522, twice the 174×261 tile, whatever size the stored URL names. Posters from other hosts SHALL be requested unchanged. The stored poster value SHALL NOT change.

#### Scenario: Large Apple poster
- **WHEN** a movie's poster is `https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/ab/cd/ef/x.jpg/2000x3000.jpg`
- **THEN** the grid requests `https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/ab/cd/ef/x.jpg/348x522bb.jpg`

#### Scenario: Other hosts
- **WHEN** a movie's poster is a TMDB `w342` URL, a `cdn.myflix.stream` URL, or empty
- **THEN** the grid requests it unchanged

#### Scenario: Full size elsewhere
- **WHEN** a movie's details are opened or returned by the APIs
- **THEN** they use the stored, full-size poster

### Requirement: Movie grid posters load as they near the screen
Every movie grid SHALL mark each poster for the browser's native lazy loading with a real `src`, so only posters near the viewport are fetched. This applies to the user's movies page, the unwatched, 4K and search lists, and the home page's top and recent movies. No poster SHALL depend on a script to start loading.

#### Scenario: Movies page
- **WHEN** a user's movies page is rendered
- **THEN** every poster has `loading="lazy"` and a `src`, and none has `data-original`

#### Scenario: Unwatched list
- **WHEN** the unwatched list is rendered
- **THEN** every poster has `loading="lazy"`
