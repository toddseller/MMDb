# Spec Delta

## Purpose

Defines how the JSON APIs (`/api/v2` for the React app, `/api/v3` for the iOS app) issue login tokens and decide whether a presented token is accepted: how long a token lasts, what makes it invalid, and how the API answers when it is.

## ADDED Requirements

### Requirement: Login issues a token whose lifetime follows "Remember me"
A successful login through `/api/v2/authenticate` or `/api/v3/authenticate` SHALL return a token that expires 30 days after issue when the request asks to be remembered, and 1 day after issue otherwise.

#### Scenario: Remembered login
- **WHEN** a user logs in with valid credentials and `remember` set to true
- **THEN** the response contains a token that the API accepts until 30 days after issue

#### Scenario: Login without remember
- **WHEN** a user logs in with valid credentials and `remember` absent or false
- **THEN** the response contains a token that the API accepts until 1 day after issue

#### Scenario: Wrong password
- **WHEN** a login request has a wrong password
- **THEN** the response is a 401 with an error message and no token

### Requirement: Signup issues a short-lived token
A successful signup through `/api/v2/signup` or `/api/v3/signup` SHALL return a token that expires 1 day after issue.

#### Scenario: New account
- **WHEN** a visitor signs up with valid details
- **THEN** the response is a 201 containing a token that the API accepts until 1 day after issue

### Requirement: The API rejects tokens it should not trust
A protected API route SHALL answer 401 with a JSON error message, and SHALL NOT return user data, when the request's token is missing, malformed, expired, has no expiry, was issued by another issuer, or was signed with a different secret.

#### Scenario: Expired token
- **WHEN** a protected route receives a token whose expiry has passed
- **THEN** the response is a 401 with a JSON error message

#### Scenario: Token issued before this change
- **WHEN** a protected route receives a token without an expiry, as every token issued before this change is
- **THEN** the response is a 401, even if the token's signature is valid

#### Scenario: Token signed with the old secret
- **WHEN** a protected route receives a token signed with a secret other than the current one
- **THEN** the response is a 401

#### Scenario: Token from another issuer
- **WHEN** a protected route receives a token signed with the current secret but naming a different issuer
- **THEN** the response is a 401

#### Scenario: No token
- **WHEN** a protected route receives a request without an `Authorization` header
- **THEN** the response is a 401

### Requirement: A valid token identifies its user
A protected API route SHALL accept a token that is unexpired, carries the configured issuer and is signed with the current secret, and SHALL act as the user the token names.

#### Scenario: Valid token
- **WHEN** a protected route such as `/api/v2/counts` receives a valid token for a user
- **THEN** the response is a 200 with that user's data
