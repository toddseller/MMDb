# Spec Delta

## MODIFIED Requirements

### Requirement: Grid posters load lazily
Show posters in the collection grid SHALL be marked for deferred loading so that the browser fetches only the posters near the viewport.

#### Scenario: Poster marked lazy
- **WHEN** the collection grid is rendered, including after adding episodes or a show
- **THEN** every poster image in it carries `loading="lazy"` and a `src`, and none depends on a script-based lazy loader
