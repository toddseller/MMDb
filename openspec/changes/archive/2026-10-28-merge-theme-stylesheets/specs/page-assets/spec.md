# Spec Delta

## MODIFIED Requirements

### Requirement: Imported theme stylesheets carry a hand-raised version
A stylesheet that `dark.css` or `default.css` pulls in with `@import` SHALL be imported with a `?v=<n>` version once its contents change, and that version SHALL be raised in the same change as every later edit to the file. Both themes import the same files, so both entry stylesheets SHALL carry the same version for each. Editing the import line also changes the top-level stylesheet, so its own version changes and browsers fetch both.

#### Scenario: Changed theme file is versioned
- **WHEN** `modals.css` is changed
- **THEN** both `dark.css` and `default.css` import it as `modals.css?v=<n>`, with the same `<n>`, higher than the version it replaced

#### Scenario: Versioned import resolves
- **WHEN** a browser requests an imported stylesheet with its `?v=` version
- **THEN** the same file is served as without the version
