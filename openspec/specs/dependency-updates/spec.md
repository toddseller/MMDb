# dependency-updates Specification

## Purpose
Defines how MMDb's dependencies and Docker base image are kept current: which ones are watched for new releases, how often update pull requests arrive and how they are grouped, and which file decides the Ruby patch version production runs.

## Requirements

### Requirement: Updates arrive as weekly pull requests
Each week, the repository SHALL receive pull requests for new releases of its gems, its npm packages, the GitHub Actions its workflows use, and its Docker base image. Minor and patch updates SHALL arrive as one pull request per ecosystem; each major update SHALL arrive as its own pull request. Every such pull request SHALL go through the same required check as any other, and none SHALL merge or deploy without the owner.

#### Scenario: Several patch releases in a week
- **WHEN** three gems publish patch releases in the same week
- **THEN** one pull request updates all three, and the required check runs on it

#### Scenario: A major release
- **WHEN** a gem the app uses publishes a new major version
- **THEN** it arrives in a pull request of its own, separate from the week's minor and patch updates

### Requirement: Base image patches reach production
The Dockerfile SHALL pin its base image by digest, so that a base image republished under the same tag, for example with patched operating system packages, arrives as an update pull request. Merging such a pull request SHALL cause the next deploy to rebuild the web image.

#### Scenario: The base image is republished
- **WHEN** `ruby:3.4.12` is republished with new Debian packages
- **THEN** a pull request updates the Dockerfile's digest, and the deploy after it is merged rebuilds the image

### Requirement: The Docker image decides the Ruby patch version
The Ruby patch version production runs SHALL be the one in the Dockerfile's base image. The app SHALL accept any patch release of its Ruby minor version, and the required check SHALL test the newest patch release of that minor version. Updates to a different Ruby minor or major version SHALL NOT be proposed automatically.

#### Scenario: A Ruby patch release
- **WHEN** Ruby 3.4.13 is released and the base image update to it is merged
- **THEN** the image builds and the app starts on 3.4.13 without any other file changing

#### Scenario: A new Ruby minor version
- **WHEN** a Ruby 3.5 base image is published
- **THEN** no update pull request proposes it
