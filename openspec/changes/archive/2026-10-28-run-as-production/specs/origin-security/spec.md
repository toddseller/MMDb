# Spec Delta

## MODIFIED Requirements

### Requirement: Error pages do not reveal the app's internals
When a request fails with an unexpected error, the response SHALL contain no stack trace, file paths, gem versions or exception messages, in every environment the server runs in, including `development`. This covers errors raised inside the app and errors that escape it to the web server. The error details SHALL still be written to the server log.

#### Scenario: Missing record on the server
- **WHEN** a visitor requests `/users/999999999` and no such user exists
- **THEN** the response is a 500 whose body does not mention the exception, any `.rb` file or any gem

#### Scenario: Error that escapes the app
- **WHEN** a request fails with an error that no part of the app handles, on the production server
- **THEN** the response is a 500 with an empty body, not the web server's stack trace

#### Scenario: Error still logged
- **WHEN** a request fails with an unexpected error
- **THEN** the exception and its backtrace appear in the server log
