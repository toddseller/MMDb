# Spec Delta

## ADDED Requirements

### Requirement: Newsletter tests gate merges
The test run SHALL type-check the newsletter job and run its unit tests in the same required check as the other suites, without network access and without real credentials. A type error or failing test SHALL fail that check.

#### Scenario: A newsletter test fails
- **WHEN** a pull request's latest commit breaks how the newsletter groups episodes into show cards
- **THEN** the required `test` check fails and the pull request can't be merged

#### Scenario: A newsletter type error
- **WHEN** a pull request's latest commit passes a card a field its type doesn't have
- **THEN** the required `test` check fails, naming the file and line

## MODIFIED Requirements

### Requirement: The production image builds in the gate
The required `test` check SHALL wait for a job that builds the Docker images production runs, the web app's and the newsletter's, from the pull request's own files, and a failure to build either SHALL fail that check.

#### Scenario: An image that doesn't build
- **WHEN** a pull request changes a Dockerfile, a base image, the gems or the newsletter's packages so that an image no longer builds
- **THEN** the required check fails and the pull request can't be merged

#### Scenario: An image that builds
- **WHEN** a pull request leaves both images buildable
- **THEN** the build step passes and the rest of the check decides the result
