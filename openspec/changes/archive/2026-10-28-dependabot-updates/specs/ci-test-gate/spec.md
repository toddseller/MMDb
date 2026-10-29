# Spec Delta

## ADDED Requirements

### Requirement: The production image builds in the gate
The required check SHALL build the Docker image production runs, from the pull request's own files, and a build failure SHALL fail that check.

#### Scenario: An image that doesn't build
- **WHEN** a pull request changes the Dockerfile, the base image or the gems so that the image no longer builds
- **THEN** the required check fails and the pull request can't be merged

#### Scenario: An image that builds
- **WHEN** a pull request leaves the image buildable
- **THEN** the build step passes and the rest of the check decides the result
