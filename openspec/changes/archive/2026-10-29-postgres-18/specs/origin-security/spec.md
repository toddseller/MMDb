## ADDED Requirements

### Requirement: The database password can stay out of the environment file
The web container SHALL be able to take its database password from a password file on the host, named by `PGPASS_FILE` in `.env`, when `DATABASE_URL` carries no password. The file SHALL be mounted read-only. When `PGPASS_FILE` is not set, the container SHALL start and connect exactly as before, with the password in `DATABASE_URL`.

#### Scenario: Password from the file
- **WHEN** `.env` sets `PGPASS_FILE` to a password file with an entry for the database, and `DATABASE_URL` has no password
- **THEN** the app connects to the database

#### Scenario: No password file configured
- **WHEN** `.env` does not set `PGPASS_FILE` and `DATABASE_URL` includes the password
- **THEN** the container starts and the app connects as it did before
