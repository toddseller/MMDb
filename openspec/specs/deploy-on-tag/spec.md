# deploy-on-tag Specification

## Purpose
Defines how a tagged MMDb release reaches production without a manual SSH session: what starts a deploy, which commits may be deployed, how the private server is reached, and how success or failure is reported.

## Requirements

### Requirement: A pushed version tag starts a deploy
Pushing a tag named `v` followed by digits and dots (for example `v2026.10.23` or `v2026.10.23.2`) SHALL start a production deploy of that tag's commit. Other tags, branch pushes and pull requests SHALL NOT start one. Only one deploy SHALL run at a time; a deploy started while another runs SHALL wait for it.

#### Scenario: Version tag
- **WHEN** the owner pushes `v2026.10.23` pointing at a commit on `master`
- **THEN** a deploy of that commit starts

#### Scenario: Other refs
- **WHEN** a branch is pushed, a pull request is opened, or a tag such as `test-1` is pushed
- **THEN** no deploy starts

### Requirement: Only tested commits on master are deployed
A deploy SHALL stop before contacting the server unless the tag's commit is reachable from `master` and that commit's `test` check finished successfully. While the check is running or has not been created yet, the deploy SHALL wait for it, for about 15 minutes at most.

#### Scenario: Commit not on master
- **WHEN** a version tag points at a commit only on a feature branch
- **THEN** the deploy fails with a message saying the commit is not on `master`, and the server is not contacted

#### Scenario: Tests failed or missing
- **WHEN** a version tag points at a `master` commit whose `test` check failed or never ran
- **THEN** the deploy fails with a message naming the check's state, and the server is not contacted

#### Scenario: Tag pushed before the test check exists
- **WHEN** a version tag is pushed while its commit's test jobs are still running and the final `test` check has not been created yet
- **THEN** the deploy waits, and continues once the `test` check finishes successfully

### Requirement: The server is reached only through an authenticated tunnel with a single-purpose key
The deploy SHALL connect to the server over SSH through Cloudflare Access with a service token, verify the server's host key against a stored value, and authenticate with a key that the server allows to run only the deploy script, with no shell, terminal or forwarding.

#### Scenario: Key used for anything else
- **WHEN** someone holding the deploy key asks the server for a shell or any command other than a deploy
- **THEN** only the deploy script runs, and it refuses anything that isn't a valid deploy request

#### Scenario: Unknown host key
- **WHEN** the host key presented through the tunnel does not match the stored one
- **THEN** the connection is refused and nothing is deployed

### Requirement: The server only moves forward to a tag on master
On the server, the deploy script SHALL accept only a tag name in the version format, SHALL fetch it from GitHub, and SHALL deploy only when the tag's commit is on `origin/master` and is the checked-out `master` or a fast-forward of it. A tag equal to the current commit SHALL be redeployed: the checkout is left as it is and the app is restarted and checked. Otherwise the script SHALL exit non-zero without changing the checkout or the running app.

#### Scenario: Malformed request
- **WHEN** the script is asked to deploy `v1; rm -rf ~` or anything not matching the version format
- **THEN** it exits non-zero without running git or docker

#### Scenario: Tag behind the server
- **WHEN** the tag points at a commit older than the server's current `master`
- **THEN** the script exits non-zero, saying the tag is not ahead, and leaves the app running unchanged

#### Scenario: Redeploying the current tag
- **WHEN** a deploy runs again for the tag the server is already on, for example after a failed health check
- **THEN** the script changes no files, restarts the web container and checks the site

#### Scenario: Local changes on the server
- **WHEN** the server's checkout has uncommitted changes to tracked files
- **THEN** the script exits non-zero before changing anything

### Requirement: The deploy rebuilds only when the image or compose setup changed
After moving `master`, the script SHALL rebuild and recreate the web container when `Gemfile`, `Gemfile.lock`, a `Dockerfile` or a compose file changed between the old and new commit, and SHALL only restart it otherwise.

#### Scenario: Code-only change
- **WHEN** the deployed commits change only application code and specs
- **THEN** the script restarts the web container and does not rebuild

#### Scenario: Dependency change
- **WHEN** the deployed commits change `Gemfile.lock`
- **THEN** the script runs `docker compose up -d --build`

### Requirement: A deploy succeeds only when the site answers
After the container is restarted or recreated, the script SHALL check that https://mmdb.online/ answers 200 within about 30 seconds, and the deploy SHALL be reported as failed in GitHub when it doesn't, or when any earlier step fails.

#### Scenario: Site up
- **WHEN** mmdb.online answers 200 after the restart
- **THEN** the workflow run succeeds and its log names the deployed tag and commit

#### Scenario: Site down
- **WHEN** mmdb.online doesn't answer 200 within the time limit
- **THEN** the script exits non-zero and the workflow run fails

### Requirement: Version tags are protected
Version tags SHALL be creatable only by the repository owner and SHALL NOT be movable or deletable, so a deploy can't be re-pointed at a different commit under the same name.

#### Scenario: Moving a tag
- **WHEN** anyone tries to force-push an existing `v*` tag to another commit
- **THEN** GitHub rejects the push
