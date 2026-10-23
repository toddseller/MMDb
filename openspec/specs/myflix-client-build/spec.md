# myflix-client-build Specification

## Purpose

Defines how the myflix React client is built and released: on a maintained Node release, free of dependencies with known vulnerabilities in what reaches users, and with its user-facing behavior verified before it ships.

## Requirements

### Requirement: The client builds on a maintained Node LTS release
The client's install, tests and production build SHALL run on a Node release line that is in active or maintenance LTS, both locally and in the Docker image that production is built from.

#### Scenario: Production image build
- **WHEN** the production image is built for the server's architecture (`linux/amd64`)
- **THEN** it installs dependencies, runs the production build on Node 24 LTS, and produces the static site nginx serves

#### Scenario: No engine overrides
- **WHEN** dependencies are installed
- **THEN** no package is installed with an `engines` requirement the build's Node version doesn't meet, and no install flag ignores engine checks

### Requirement: Releases carry no known-vulnerable dependencies where a fix exists
A release SHALL contain no dependency matching an open security advisory that has a published fix, checked against the release's final lockfile; code that reaches the browser SHALL match no open advisory at all.

#### Scenario: Checked against the final lockfile
- **WHEN** dependencies have been changed for a release
- **THEN** the advisory check runs against the lockfile as it will be merged, after every dependency change, so advisories for newly introduced versions are caught before release

#### Scenario: Browser bundle
- **WHEN** the production bundle's packages are compared with open advisories
- **THEN** none of them matches

#### Scenario: Advisory without a fix
- **WHEN** an advisory affects a build-only dependency and has no published fix
- **THEN** it may remain, and the release notes name it

### Requirement: User-facing behavior is verified before release
Before a release, the client SHALL be built as it will ship and exercised against the live MMDb API, and SHALL behave as the previous release did.

#### Scenario: Public home page
- **WHEN** a visitor opens the home page
- **THEN** the most popular movies, recent movies, recent shows and top users load from the API

#### Scenario: Login and collection
- **WHEN** a user logs in, with or without "Remember me"
- **THEN** they land on their collection, its movies and TV shows tabs list their titles with posters loading as they scroll, and the login is stored where it was before

#### Scenario: Deep link
- **WHEN** a signed-in user opens or reloads a client-side address such as `/browse/1` directly
- **THEN** that page loads, not an error

#### Scenario: Existing protections
- **WHEN** the release is tested
- **THEN** the `myflix-client-security` behaviors still hold: a 401 signs the user out, and titles show as text with entities decoded

### Requirement: Changes reach master only through a passing test run
Every pull request to `master`, and every push to `master`, SHALL run the client's tests and production build on the project's Node LTS version, and a pull request SHALL NOT be mergeable until that run passes for its latest commit.

#### Scenario: Pull request
- **WHEN** a pull request targeting `master` is opened or receives a new commit
- **THEN** the run starts and its result is shown on the pull request

#### Scenario: Failing run
- **WHEN** a test or the production build fails on the pull request's latest commit
- **THEN** the pull request cannot be merged

#### Scenario: Dependency update
- **WHEN** Dependabot opens a pull request against `master`
- **THEN** it is tested like any other pull request
