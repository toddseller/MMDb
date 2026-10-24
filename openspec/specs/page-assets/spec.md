# page-assets Specification

## Purpose
Makes sure a deployed change to the app's own scripts and stylesheets reaches browsers right away, without anyone needing a hard reload past the cache.

## Requirements

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

### Requirement: Imported theme stylesheets carry a hand-raised version
A theme stylesheet that `dark.css` or `default.css` pulls in with `@import` SHALL be imported with a `?v=<n>` version once its contents change, and that version SHALL be raised in the same change as every later edit to the file. Editing the import line also changes the top-level stylesheet, so its own version changes and browsers fetch both.

#### Scenario: Changed theme file is versioned
- **WHEN** `themes/dark/modals.css` or `themes/default/modals.css` is changed
- **THEN** `dark.css` or `default.css` imports it as `themes/<theme>/modals.css?v=<n>`, with `<n>` higher than the version it replaced

#### Scenario: Versioned import resolves
- **WHEN** a browser requests an imported stylesheet with its `?v=` version
- **THEN** the same file is served as without the version

### Requirement: Script modules load from versioned URLs
Every page SHALL include an import map that resolves each of the app's script modules (those under `/js/mmdb/`) to a URL with a `v` query parameter that changes whenever that file's contents are replaced, and stays the same while the file is unchanged. The modules SHALL import each other only through those mapped names, so no module is ever fetched without its version.

#### Scenario: Modules are versioned
- **WHEN** any page is rendered
- **THEN** its import map lists every file in `public/js/mmdb/`, each mapped to `/js/mmdb/<file>?v=<version>`

#### Scenario: Version follows the module
- **WHEN** `public/js/mmdb/filters.js` is replaced and a page is rendered again
- **THEN** that module's mapped URL has a different version, and the other modules' versions are unchanged
