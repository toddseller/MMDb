# Spec Delta

## ADDED Requirements

### Requirement: Browser tests cover the major flows
The test run SHALL include browser tests that drive a real browser against the app for the movie details drawer, the filters, adding a movie, editing and rating a movie, adding an episode and setting a show's default season, the sign-in and profile modals with the edit-show tabs and the theme switch, artwork upload, and deleting a movie. They SHALL check what a user sees, not how the page's script is written, so they hold across a rewrite of the front-end JavaScript.

#### Scenario: A flow breaks
- **WHEN** a change stops one of these flows working in the browser, for example the drawer no longer opening
- **THEN** a browser test fails and names the flow

#### Scenario: Script rewritten, behaviour unchanged
- **WHEN** the page's JavaScript is replaced but every flow behaves as before
- **THEN** the browser tests pass unchanged

### Requirement: Browser tests run isolated
Browser tests SHALL run the app against their own database, loaded with known data before each run, and SHALL never use the production database or the RSpec suite's database. The app SHALL run with the suite's fixed test settings, without real credentials. Any outbound request from the app without a stub SHALL fail and name the request. The browser SHALL load nothing from outside the app, and any outside service a flow depends on SHALL be answered by the test.

#### Scenario: Local `.env` present
- **WHEN** a developer runs the browser tests on a machine whose `.env` points at the production database
- **THEN** the app under test still uses the browser-test database and the fixed test settings

#### Scenario: Upload to S3
- **WHEN** the artwork upload test submits a file
- **THEN** the test answers the browser's upload request, and nothing is sent to S3

### Requirement: Browser tests gate merges
The browser tests SHALL run in the same required check as the RSpec suite, for every pull request into `master` and every push to it, and a failing browser test SHALL fail that check.

#### Scenario: Browser test fails on a pull request
- **WHEN** a pull request's latest commit makes a browser test fail
- **THEN** the required `test` check fails and the pull request can't be merged
