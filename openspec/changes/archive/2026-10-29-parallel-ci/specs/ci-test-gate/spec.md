## MODIFIED Requirements

### Requirement: Browser tests gate merges
The browser tests SHALL run for every pull request into `master` and every push to it, in jobs the required `test` check waits for, and a failing browser test SHALL fail that check.

#### Scenario: Browser test fails on a pull request
- **WHEN** a pull request's latest commit makes a browser test fail
- **THEN** the required `test` check fails and the pull request can't be merged

### Requirement: The production image builds in the gate
The required `test` check SHALL wait for a job that builds the Docker image production runs, from the pull request's own files, and a build failure SHALL fail that check.

#### Scenario: An image that doesn't build
- **WHEN** a pull request changes the Dockerfile, the base image or the gems so that the image no longer builds
- **THEN** the required check fails and the pull request can't be merged

#### Scenario: An image that builds
- **WHEN** a pull request leaves the image buildable
- **THEN** the build step passes and the rest of the check decides the result

## ADDED Requirements

### Requirement: The required check passes only when every test job passed
The test suites SHALL run as parallel jobs, with the browser tests split across several. The required `test` check SHALL run after all of them, even when one fails, and SHALL pass only if every one of them passed; a job that failed, was cancelled or was skipped SHALL fail it.

#### Scenario: One shard fails
- **WHEN** one browser-test shard fails and every other job passes
- **THEN** the `test` check fails

#### Scenario: Everything passes
- **WHEN** the image, unit and browser jobs all pass
- **THEN** the `test` check passes
