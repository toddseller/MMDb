# Spec Delta

## ADDED Requirements

### Requirement: Imported theme stylesheets carry a hand-raised version
A theme stylesheet that `dark.css` or `default.css` pulls in with `@import` SHALL be imported with a `?v=<n>` version once its contents change, and that version SHALL be raised in the same change as every later edit to the file. Editing the import line also changes the top-level stylesheet, so its own version changes and browsers fetch both.

#### Scenario: Changed theme file is versioned
- **WHEN** `themes/dark/modals.css` or `themes/default/modals.css` is changed
- **THEN** `dark.css` or `default.css` imports it as `themes/<theme>/modals.css?v=<n>`, with `<n>` higher than the version it replaced

#### Scenario: Versioned import resolves
- **WHEN** a browser requests an imported stylesheet with its `?v=` version
- **THEN** the same file is served as without the version
