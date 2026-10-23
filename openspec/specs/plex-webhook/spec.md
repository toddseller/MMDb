# plex-webhook Specification

## Purpose

Defines what the Plex webhook at `/v1/webhooks/new` accepts: how it confirms a request comes from the owner's Plex server, and which events it acts on.

## Requirements

### Requirement: The webhook requires the shared secret
The webhook SHALL act on a request only when the request URL's `token` parameter equals the configured webhook secret, and SHALL answer 401 without reading or acting on the payload otherwise.

#### Scenario: Correct secret
- **WHEN** Plex posts a `library.new` event for the configured Plex account with the correct `token` in the URL
- **THEN** the response is a 204 and the new show or movie is added for the configured user

#### Scenario: Wrong secret
- **WHEN** a request arrives with a `token` that does not match the secret
- **THEN** the response is a 401 and nothing is added

#### Scenario: No secret in the URL
- **WHEN** a request arrives without a `token` parameter, as every request did before this change
- **THEN** the response is a 401 and nothing is added

### Requirement: The webhook fails closed when unconfigured
When no webhook secret is configured, the webhook SHALL reject every request with a 401.

#### Scenario: Secret setting missing
- **WHEN** the server has no webhook secret configured and a request arrives, with or without a `token`
- **THEN** the response is a 401 and nothing is added

### Requirement: The webhook acts only on new-library events for the configured account
An authenticated request SHALL add content only for a `library.new` event from the configured Plex account; any other event or account SHALL be acknowledged with a 204 and ignored.

#### Scenario: Other Plex account
- **WHEN** an authenticated request carries an event from a Plex account other than the configured one
- **THEN** the response is a 204 and nothing is added

#### Scenario: Other event type
- **WHEN** an authenticated request carries an event other than `library.new`, such as playback
- **THEN** the response is a 204 and nothing is added
