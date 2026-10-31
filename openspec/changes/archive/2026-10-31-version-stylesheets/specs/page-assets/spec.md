# Spec Delta

## MODIFIED Requirements

### Requirement: Own assets carry a version that changes with the file
Every page SHALL reference the app's own scripts and stylesheets (those under `/js/` and `/css/`) with a `v` query parameter that changes whenever the file's contents are replaced, and stays the same while the file is unchanged. Every stylesheet SHALL be linked from the page itself, so no stylesheet is ever fetched without its version, and they SHALL apply in a fixed order, the same for every page and theme.

#### Scenario: Scripts and stylesheet are versioned
- **WHEN** any page is rendered
- **THEN** each `/js/` script and each `/css/` stylesheet in it has a URL of the form `/css/movies.css?v=<version>`

#### Scenario: Version follows the file
- **WHEN** `public/js/main.js` is replaced and a page is rendered again
- **THEN** the version in its URL differs from the version before the change

#### Scenario: A stylesheet's version follows its file
- **WHEN** `public/css/movies.css` is replaced and a page is rendered again
- **THEN** its URL has a different version, and the other stylesheets' versions are unchanged

#### Scenario: Version is stable
- **WHEN** two pages are rendered without any file changing
- **THEN** both use the same version for each file

#### Scenario: Stylesheets pull in nothing unversioned
- **WHEN** any of the app's stylesheets is read
- **THEN** it has no `@import`

### Requirement: Pages carry no third-party snippets
No page SHALL include a script, stylesheet or frame from another site. Every script SHALL be the app's own (`/js/`) or its import map, every stylesheet SHALL be the app's own (`/css/`), and pages SHALL NOT include tag managers, analytics or experiment snippets. Images and links to MMDb's content (posters, artwork, the media server) are not snippets and are unaffected. A beacon Cloudflare adds at its edge is outside the app and is not covered.

#### Scenario: Rendered page
- **WHEN** any page is rendered
- **THEN** every `<script>` is the import map or has a `src` under `/js/`, and the page has no `<iframe>` and no reference to Google Tag Manager, Google Analytics or Optimizely

#### Scenario: Loaded in a browser
- **WHEN** a visitor loads the movies page with every site but the app blocked
- **THEN** the page makes no request to any other host for a script, stylesheet or frame

#### Scenario: No experiment restyles the page
- **WHEN** a visitor loads any page in any theme, whatever cookies they carry from earlier visits
- **THEN** every stylesheet on the page is one of the app's own under `/css/`, and the set is the same for every theme

## REMOVED Requirements

### Requirement: Imported theme stylesheets carry a hand-raised version
**Reason**: Every stylesheet is now linked from the page with a version taken from its file, so no stylesheet is imported and no version is raised by hand. Forgetting to raise one shipped a stale `movies.css` to production (PR #491, fixed by PR #492).
**Migration**: None for users. Developers edit a stylesheet and deploy; its URL changes on its own. A new stylesheet is added to the page's list of stylesheets in place of an `@import` line.
