# Spec Delta

## ADDED Requirements

### Requirement: A deploy applies pending database migrations first
After moving `master`, and before restarting or recreating the web container, the script SHALL run the app's pending database migrations in the running web container, on every deploy including a redeploy of the tag the server is already on. When none are pending this SHALL change nothing. When a migration fails, the script SHALL stop without restarting or recreating the container, and the deploy SHALL be reported as failed; deploying the same tag again SHALL retry the migrations.

#### Scenario: A release with a migration
- **WHEN** the deployed commits add a migration
- **THEN** the script runs the migrations in the web container, then restarts it

#### Scenario: Nothing pending
- **WHEN** the deployed commits change only application code
- **THEN** the script runs the migrations, which change nothing, then restarts the web container

#### Scenario: A failed migration
- **WHEN** a migration fails during a deploy
- **THEN** the script exits non-zero without restarting the web container, and the workflow run fails

#### Scenario: Retrying
- **WHEN** a deploy failed in its migrations and the same tag is deployed again after the problem is fixed on the server
- **THEN** the script runs the migrations again before restarting
