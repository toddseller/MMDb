## MODIFIED Requirements

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
