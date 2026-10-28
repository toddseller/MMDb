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

### Requirement: The webhook secret never appears in logs
The webhook secret SHALL NOT be written to any log, including the access log line for the request.

#### Scenario: Access log line
- **WHEN** any request to the webhook carries `?token=` in its URL, correct or not
- **THEN** the access log records the path without the token

### Requirement: A show-level import adds only aired episodes
When Plex reports a whole show rather than one episode, the import SHALL add only those episodes of the fetched season whose air date is today or earlier. An episode with no air date SHALL NOT be added. This applies to seasons from both TMDB and Apple.

#### Scenario: Season with aired, upcoming and undated episodes
- **WHEN** Plex reports a show whose latest season has episodes 1 and 2 aired before today, episode 3 airing today, episode 4 airing next week and episode 5 with no air date
- **THEN** episodes 1, 2 and 3 are added and episodes 4 and 5 are not

#### Scenario: TMDB season
- **WHEN** Plex reports a show whose latest season comes from TMDB and lists one aired and one upcoming episode
- **THEN** only the aired episode is added

### Requirement: A single-episode import ignores the air date
When Plex reports one episode, the import SHALL add that episode whatever its air date, because Plex already has its file.

#### Scenario: Episode dated in the future
- **WHEN** Plex reports an episode whose source lists an air date of tomorrow
- **THEN** the episode is added

### Requirement: An import refreshes an episode already stored
When a Plex import, show-level or single-episode, includes an episode the season already has, the stored episode's title, air date, plot, runtime and still SHALL be replaced with the fetched values, including values edited by hand.

#### Scenario: Placeholder replaced by a single-episode import
- **WHEN** a season stores episode 6 as "Episode 6" with no plot, and Plex reports episode 6, whose source now lists a title and plot
- **THEN** the stored episode 6 has the fetched title and plot, and the season still has one episode 6

#### Scenario: Placeholder replaced by a show-level import
- **WHEN** a season stores episode 2 as "Episode 2" with no plot, and Plex reports the show after episode 2 has aired
- **THEN** the stored episode 2 has the fetched title and plot

#### Scenario: Hand edit overwritten
- **WHEN** a stored episode's title was changed by hand, and Plex reports that episode again
- **THEN** the stored title is the source's title

### Requirement: A webhook URL that can't be parsed is rejected
A webhook request whose query string can't be parsed, such as one with a malformed `%` escape, SHALL be answered with a 400 and SHALL NOT import anything. The secret can't be read from such a URL, so the request is never treated as authenticated.

#### Scenario: Malformed escape in the token
- **WHEN** a request arrives at `/v1/webhooks/new?token=%zz`
- **THEN** the response is a 400, its body shows no stack trace, and nothing is added
