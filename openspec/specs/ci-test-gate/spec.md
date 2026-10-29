# ci-test-gate Specification

## Purpose

Defines how changes to MMDb are verified before they reach `master`, which production deploys from: when the test suite runs, what blocks a merge, and the isolation and reporting every test run guarantees.

## Requirements

### Requirement: The suite runs on every pull request and push to master
The full test suite SHALL run automatically for every pull request that targets `master`, on each new commit pushed to it, and for every push to `master`.

#### Scenario: Pull request opened
- **WHEN** a pull request targeting `master` is opened or receives a new commit
- **THEN** a test run starts for its latest commit and its result is shown on the pull request

#### Scenario: Dependency update
- **WHEN** an automated dependency update opens a pull request against `master`
- **THEN** the suite runs on it like any other pull request

#### Scenario: Push to master
- **WHEN** a commit lands on `master`
- **THEN** a test run starts for that commit

### Requirement: A failing suite blocks the merge
A pull request into `master` SHALL NOT be mergeable until the test run for its latest commit has passed.

#### Scenario: Failing test
- **WHEN** any example in the suite fails or errors on the pull request's latest commit
- **THEN** the pull request cannot be merged

#### Scenario: Passing run
- **WHEN** the test run for the latest commit passes
- **THEN** the test requirement no longer blocks the merge

### Requirement: Tests run against the production schema
Each test run SHALL use a database whose schema matches production's, on the same Postgres major version, and SHALL never connect to the production database, whatever the environment configures.

#### Scenario: Column added outside the migrations
- **WHEN** production has a column that no migration creates (such as `shows."episodeCount"`)
- **THEN** the test database has that column too

#### Scenario: Environment points at production
- **WHEN** the environment or a `.env` file sets the database URL to the production server
- **THEN** the tests still use only the local test database

### Requirement: Tests never reach external services
A test that makes an outbound HTTP request without a stubbed response SHALL fail, naming the request it tried to make.

#### Scenario: Unstubbed request
- **WHEN** code under test calls an external API (for example Apple TV, TMDB, TVDB or Tautulli) and no stub matches
- **THEN** the example fails with an error that names the blocked URL, and no request leaves the machine

#### Scenario: Stubbed request
- **WHEN** a test stubs a response for the URL the code calls
- **THEN** the code receives the stubbed response

### Requirement: The suite runs without secrets
The suite SHALL pass without a `.env` file or any real credentials, using fixed test values for the settings the code reads, and SHALL use those test values even when a local `.env` provides real ones.

#### Scenario: No .env file
- **WHEN** the suite runs on a machine with no `.env` file, as in CI
- **THEN** every example that passes locally passes there too

#### Scenario: Local .env with real keys
- **WHEN** the suite runs on a machine whose `.env` holds real API keys and a real JWT secret
- **THEN** tests see the test values, not the real ones

### Requirement: Each run reports coverage
Each test run SHALL produce a line-coverage report for the application code, viewable after a CI run, without failing the run at any coverage level.

#### Scenario: CI run
- **WHEN** a test run in CI finishes, pass or fail
- **THEN** the total line coverage appears in its log and the full report can be downloaded from the run

#### Scenario: Low coverage
- **WHEN** coverage is low, as it is while most of the project is still untested
- **THEN** the run's result depends only on the examples, not on coverage

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

### Requirement: Front-end unit tests gate merges
The test run SHALL include unit tests for the app's script modules, run without a browser and without network access, in the same required check as the RSpec suite and the browser tests. A failing unit test SHALL fail that check, and the browser tests SHALL NOT run after a unit test fails.

#### Scenario: Unit test fails on a pull request
- **WHEN** a pull request's latest commit makes a script module's unit test fail
- **THEN** the required `test` check fails, without running the browser tests

### Requirement: Script modules are type-checked in the gate
The app's script modules and their unit tests SHALL be type-checked from their JSDoc types, without being compiled, in the same required check. A type error SHALL fail that check before the unit tests and browser tests run, and the files served to browsers SHALL be the checked source files themselves.

#### Scenario: Type error on a pull request
- **WHEN** a pull request's latest commit passes a number where a module's JSDoc type expects a string
- **THEN** the required `test` check fails, naming the file and line, without running the unit or browser tests

#### Scenario: Served as written
- **WHEN** a page loads a script module
- **THEN** the browser receives the same JavaScript file that was type-checked, with no compiled copy

### Requirement: The production image builds in the gate
The required check SHALL build the Docker image production runs, from the pull request's own files, and a build failure SHALL fail that check.

#### Scenario: An image that doesn't build
- **WHEN** a pull request changes the Dockerfile, the base image or the gems so that the image no longer builds
- **THEN** the required check fails and the pull request can't be merged

#### Scenario: An image that builds
- **WHEN** a pull request leaves the image buildable
- **THEN** the build step passes and the rest of the check decides the result
