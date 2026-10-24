# Spec Delta

## ADDED Requirements

### Requirement: Script modules load from versioned URLs
Every page SHALL include an import map that resolves each of the app's script modules (those under `/js/mmdb/`) to a URL with a `v` query parameter that changes whenever that file's contents are replaced, and stays the same while the file is unchanged. The modules SHALL import each other only through those mapped names, so no module is ever fetched without its version.

#### Scenario: Modules are versioned
- **WHEN** any page is rendered
- **THEN** its import map lists every file in `public/js/mmdb/`, each mapped to `/js/mmdb/<file>?v=<version>`

#### Scenario: Version follows the module
- **WHEN** `public/js/mmdb/filters.js` is replaced and a page is rendered again
- **THEN** that module's mapped URL has a different version, and the other modules' versions are unchanged
