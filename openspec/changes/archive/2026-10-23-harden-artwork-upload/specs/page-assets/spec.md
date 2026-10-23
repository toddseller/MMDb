# Spec Delta

## Purpose

Makes sure a deployed change to the app's own scripts and stylesheets reaches browsers right away, without anyone needing a hard reload past the cache.

## ADDED Requirements

### Requirement: Own assets carry a version that changes with the file
Every page SHALL reference the app's own scripts and stylesheets (those under `/js/` and `/css/`) with a `v` query parameter that changes whenever the file's contents are replaced, and stays the same while the file is unchanged.

#### Scenario: Scripts and stylesheet are versioned
- **WHEN** any page is rendered
- **THEN** each `/js/` script and the `/css/` stylesheet in it has a URL of the form `/js/mmdb.js?v=<version>`

#### Scenario: Version follows the file
- **WHEN** `public/js/mmdb.js` is replaced and a page is rendered again
- **THEN** the version in its URL differs from the version before the change

#### Scenario: Version is stable
- **WHEN** two pages are rendered without any file changing
- **THEN** both use the same version for each file
