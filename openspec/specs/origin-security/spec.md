# origin-security Specification

## Purpose
Defines what the MMDb server reveals to visitors and who can reach it: error pages that hide the app's internals, signing secrets the server will not run without, and a web port reachable only through the Cloudflare tunnel.

## Requirements

### Requirement: Error pages do not reveal the app's internals
When a request fails with an unexpected error, the response SHALL be a 500 that contains no stack trace, file paths, gem versions or exception messages, in every environment the server runs in, including `development`. The error details SHALL still be written to the server log.

#### Scenario: Missing record on the server
- **WHEN** a visitor requests `/users/999999999` and no such user exists, with the server running as `RACK_ENV=development`
- **THEN** the response is a 500 whose body does not mention the exception, any `.rb` file or any gem

#### Scenario: Error still logged
- **WHEN** a request fails with an unexpected error
- **THEN** the exception and its backtrace appear in the server log

### Requirement: The server does not start without its signing secrets
The server SHALL refuse to start when `SESSION_SECRET` or `JWT_SECRET` is missing or blank, and SHALL name the missing variable when it stops. It SHALL never sign sessions or tokens with a built-in default secret.

#### Scenario: Session secret missing
- **WHEN** the server starts with `SESSION_SECRET` unset or blank
- **THEN** it exits with an error that names `SESSION_SECRET` and serves no requests

#### Scenario: Token secret missing
- **WHEN** the server starts with `JWT_SECRET` unset or blank
- **THEN** it exits with an error that names `JWT_SECRET` and serves no requests

#### Scenario: Both secrets set
- **WHEN** the server starts with both secrets set
- **THEN** it starts normally

### Requirement: The web port is reachable only from the server itself
The web container's port SHALL be published on the host's loopback address only. Production traffic SHALL reach the app through the Cloudflare tunnel, which connects to the container over the Docker network.

#### Scenario: Request from another machine on the network
- **WHEN** another machine on the home network requests `http://<server LAN address>:4666/`
- **THEN** the connection is refused

#### Scenario: Request through Cloudflare
- **WHEN** a visitor requests `https://mmdb.online/`
- **THEN** the page loads as before

#### Scenario: Local Docker development
- **WHEN** a developer runs the app with `docker compose up` on their own machine
- **THEN** it answers at `http://localhost:4666`
