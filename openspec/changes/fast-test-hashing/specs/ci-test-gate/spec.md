## ADDED Requirements

### Requirement: Tests hash passwords cheaply, the app does not
The RSpec suite and the browser tests' server and seed SHALL hash passwords at bcrypt's minimum cost. The app loaded without the test settings, as production loads it, SHALL hash at bcrypt's default cost.

#### Scenario: A test user
- **WHEN** a test creates a user
- **THEN** the stored password hash uses bcrypt's minimum cost

#### Scenario: The app outside the tests
- **WHEN** the app is loaded without the test settings
- **THEN** new password hashes use bcrypt's default cost
