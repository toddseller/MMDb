## ADDED Requirements

### Requirement: Every deploy builds the image and recreates the app from it
After moving `master`, the script SHALL build the web image on every deploy, including a redeploy of the tag the server is already on, and after the migrations SHALL recreate the web container from that image. When the build fails, the script SHALL stop without migrating or touching the running container, and the deploy SHALL be reported as failed.

#### Scenario: Code-only change
- **WHEN** the deployed commits change only application code and specs
- **THEN** the script builds the image, runs the migrations, and recreates the web container

#### Scenario: Dependency change
- **WHEN** the deployed commits change `Gemfile.lock`
- **THEN** the image is built with the new gems before the migrations run, and the web container is recreated from it

#### Scenario: Retrying a dependency change
- **WHEN** a deploy that changed `Gemfile.lock` failed, and the same tag is deployed again
- **THEN** the script builds the image again, so the retry runs with the new gems

#### Scenario: Build fails
- **WHEN** the image fails to build
- **THEN** the script exits non-zero without running migrations or recreating the web container, and the workflow run fails

## MODIFIED Requirements

### Requirement: The server only moves forward to a tag on master
On the server, the deploy script SHALL accept only a tag name in the version format, SHALL fetch it from GitHub, and SHALL deploy only when the tag's commit is on `origin/master` and is the checked-out `master` or a fast-forward of it. A tag equal to the current commit SHALL be redeployed: the checkout is left as it is and the app is rebuilt, recreated and checked. Otherwise the script SHALL exit non-zero without changing the checkout or the running app.

#### Scenario: Malformed request
- **WHEN** the script is asked to deploy `v1; rm -rf ~` or anything not matching the version format
- **THEN** it exits non-zero without running git or docker

#### Scenario: Tag behind the server
- **WHEN** the tag points at a commit older than the server's current `master`
- **THEN** the script exits non-zero, saying the tag is not ahead, and leaves the app running unchanged

#### Scenario: Redeploying the current tag
- **WHEN** a deploy runs again for the tag the server is already on, for example after a failed health check
- **THEN** the script changes no files, builds the image, recreates the web container and checks the site

#### Scenario: Local changes on the server
- **WHEN** the server's checkout has uncommitted changes to tracked files
- **THEN** the script exits non-zero before changing anything

### Requirement: A deploy applies pending database migrations first
After building the image, and before recreating the web container, the script SHALL run the app's pending database migrations in a one-off container from the newly built image, on every deploy including a redeploy of the tag the server is already on. When none are pending this SHALL change nothing. When a migration fails, the script SHALL stop without recreating the container, and the deploy SHALL be reported as failed; deploying the same tag again SHALL retry the migrations.

#### Scenario: A release with a migration
- **WHEN** the deployed commits add a migration
- **THEN** the script runs the migrations from the new image, then recreates the web container

#### Scenario: A release with new gems
- **WHEN** the deployed commits change `Gemfile.lock`
- **THEN** the migrations run with the new gems and do not fail for want of them

#### Scenario: Nothing pending
- **WHEN** the deployed commits change only application code
- **THEN** the script runs the migrations, which change nothing, then recreates the web container

#### Scenario: A failed migration
- **WHEN** a migration fails during a deploy
- **THEN** the script exits non-zero without recreating the web container, and the workflow run fails

#### Scenario: Retrying
- **WHEN** a deploy failed in its migrations and the same tag is deployed again after the problem is fixed on the server
- **THEN** the script runs the migrations again before recreating the container

## REMOVED Requirements

### Requirement: The deploy rebuilds only when the image or compose setup changed
**Reason**: Deciding by a diff of old and new commits misses a retry (the diff is empty once the server is on the tag), and the migrations ran before the rebuild in a container without the new gems, which failed v2026.11.06.0.
**Migration**: Replaced by "Every deploy builds the image and recreates the app from it". Nothing for the owner to do; Docker's layer cache keeps a build without gem changes to seconds.
