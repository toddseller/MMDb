# Spec Delta

## ADDED Requirements

### Requirement: A webhook URL that can't be parsed is rejected
A webhook request whose query string can't be parsed, such as one with a malformed `%` escape, SHALL be answered with a 400 and SHALL NOT import anything. The secret can't be read from such a URL, so the request is never treated as authenticated.

#### Scenario: Malformed escape in the token
- **WHEN** a request arrives at `/v1/webhooks/new?token=%zz`
- **THEN** the response is a 400, its body shows no stack trace, and nothing is added
