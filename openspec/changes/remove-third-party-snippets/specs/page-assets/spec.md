# Spec Delta

## ADDED Requirements

### Requirement: Pages carry no third-party snippets
No page SHALL include a script, stylesheet or frame from another site. Every script SHALL be the app's own (`/js/`) or its import map, and pages SHALL NOT include tag managers, analytics or experiment snippets. Images and links to MMDb's content (posters, artwork, the media server) are not snippets and are unaffected. A beacon Cloudflare adds at its edge is outside the app and is not covered.

#### Scenario: Rendered page
- **WHEN** any page is rendered
- **THEN** every `<script>` is the import map or has a `src` under `/js/`, and the page has no `<iframe>` and no reference to Google Tag Manager, Google Analytics or Optimizely

#### Scenario: Loaded in a browser
- **WHEN** a visitor loads the movies page with every site but the app blocked
- **THEN** the page makes no request to any other host for a script, stylesheet or frame

#### Scenario: No experiment restyles the page
- **WHEN** a visitor using the light theme loads any page, whatever cookies they carry from earlier visits
- **THEN** the only stylesheet on the page is the light theme's
