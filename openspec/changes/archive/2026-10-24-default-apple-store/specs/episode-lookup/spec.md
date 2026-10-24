# Spec Delta

## Purpose

Defines how the episodes of a stored season are fetched from the source it came from, for adding episodes by hand, through the APIs, and from the Plex webhook.

## ADDED Requirements

### Requirement: Apple lookups without a stored storefront use the US store
When a season's episodes are fetched from Apple and the season has no stored storefront (nil or blank), the lookup SHALL use the US storefront (`143441`). A season with a stored storefront SHALL keep using it.

#### Scenario: Season added before storefronts were stored
- **WHEN** an Apple season with skip 0, count 11 and no storefront is opened to add episodes
- **THEN** its 11 episodes are fetched from the US storefront and listed

#### Scenario: Plex reports an episode of such a season
- **WHEN** Plex reports a new episode of an Apple season that has no storefront
- **THEN** the episode is fetched from the US storefront and imported

#### Scenario: Stored storefront kept
- **WHEN** an Apple season stored with the UK storefront (`143444`) is opened to add episodes
- **THEN** its episodes are fetched from the UK storefront
