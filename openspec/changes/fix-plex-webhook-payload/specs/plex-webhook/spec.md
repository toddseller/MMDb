# Spec Delta

## ADDED Requirements

### Requirement: The webhook reads the event in any form Plex sends
An authenticated request SHALL be handled the same whether its event arrives as a `payload` text field, as a `payload` file part, or as a JSON request body.

#### Scenario: Payload as a text field
- **WHEN** an authenticated multipart request carries the event JSON in a `payload` field without a filename
- **THEN** the event is read and handled

#### Scenario: Payload as a file part
- **WHEN** an authenticated multipart request carries the event JSON in a `payload` part that has a filename and content type, so it arrives as an uploaded file
- **THEN** the event is read from the file and handled

#### Scenario: JSON request body
- **WHEN** an authenticated request has a JSON body containing the event and no `payload` field
- **THEN** the event is read and handled, even though the body can be read only once

### Requirement: An unreadable event is rejected without importing
An authenticated request whose event is missing or is not valid JSON SHALL be answered with a 400 and SHALL NOT import anything.

#### Scenario: Invalid JSON
- **WHEN** an authenticated request's `payload` is not valid JSON
- **THEN** the response is a 400 and nothing is added

#### Scenario: No event at all
- **WHEN** an authenticated request has neither a `payload` field nor a JSON body
- **THEN** the response is a 400 and nothing is added

### Requirement: Each webhook request's shape is logged without values
Each authenticated webhook request SHALL write one log line naming the request content type, its parameter names and, for `payload`, whether it was text or a file and the file's content type. The line SHALL NOT contain parameter values, event contents or the webhook secret.

#### Scenario: Plex event logged
- **WHEN** an authenticated webhook request is handled
- **THEN** the log contains one line with its content type, parameter names and payload kind, and no part of the event JSON

### Requirement: The webhook secret never appears in logs
The webhook secret SHALL NOT be written to any log, including the access log line for the request.

#### Scenario: Access log line
- **WHEN** any request to the webhook carries `?token=` in its URL, correct or not
- **THEN** the access log records the path without the token
