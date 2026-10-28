# Spec Delta

## MODIFIED Requirements

### Requirement: Imported theme stylesheets carry a hand-raised version
A stylesheet that `app.css` pulls in with `@import` SHALL be imported with a `?v=<n>` version once its contents change, and that version SHALL be raised in the same change as every later edit to the file. Editing the import line also changes the top-level stylesheet, so its own version changes and browsers fetch both.

#### Scenario: Changed theme file is versioned
- **WHEN** `modals.css` is changed
- **THEN** `app.css` imports it as `modals.css?v=<n>`, with `<n>` higher than the version it replaced

#### Scenario: Versioned import resolves
- **WHEN** a browser requests an imported stylesheet with its `?v=` version
- **THEN** the same file is served as without the version

### Requirement: Pages carry no third-party snippets
No page SHALL include a script, stylesheet or frame from another site. Every script SHALL be the app's own (`/js/`) or its import map, and pages SHALL NOT include tag managers, analytics or experiment snippets. Images and links to MMDb's content (posters, artwork, the media server) are not snippets and are unaffected. A beacon Cloudflare adds at its edge is outside the app and is not covered.

#### Scenario: Rendered page
- **WHEN** any page is rendered
- **THEN** every `<script>` is the import map or has a `src` under `/js/`, and the page has no `<iframe>` and no reference to Google Tag Manager, Google Analytics or Optimizely

#### Scenario: Loaded in a browser
- **WHEN** a visitor loads the movies page with every site but the app blocked
- **THEN** the page makes no request to any other host for a script, stylesheet or frame

#### Scenario: No experiment restyles the page
- **WHEN** a visitor loads any page in any theme, whatever cookies they carry from earlier visits
- **THEN** the only stylesheet on the page is the app's own `app.css`
