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
