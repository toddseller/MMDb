# myflix-client-security Specification

## Purpose

Defines the protections the myflix React client gives its users: leaving the signed-in state when the API stops accepting the stored login, and showing text that comes from the API without running any markup in it.

## Requirements

### Requirement: A rejected login signs the user out
When any request to the MMDb API answers 401, the client SHALL remove the stored login from both browser storages, show the user as signed out, and take them to the login page.

#### Scenario: Remembered login has expired
- **WHEN** a user with a remembered login opens the app after the token has expired, and the first API request answers 401
- **THEN** the stored login is gone, the header no longer shows the user as signed in, and the login page is shown

#### Scenario: Secret rotated while browsing
- **WHEN** a signed-in user's next API request answers 401 because the token is no longer accepted
- **THEN** the user is signed out and taken to the login page

#### Scenario: Logging in again
- **WHEN** the signed-out user logs in on the login page
- **THEN** the new login is stored and the app works as before

#### Scenario: Other errors
- **WHEN** an API request fails with a status other than 401
- **THEN** the stored login is kept and the user stays signed in

### Requirement: Text from the API is shown as text
The client SHALL display show titles from the API as plain text, decoding HTML entities so that, for example, `Law &amp; Order` reads `Law & Order`, and SHALL NOT execute or render any markup a title contains.

#### Scenario: Title with an entity
- **WHEN** a show's title from the API is `Law &amp; Order`
- **THEN** the grid shows `Law & Order`

#### Scenario: Title with markup
- **WHEN** a show's title from the API contains markup such as `<img src=x onerror=alert(1)>` or a `<script>` element
- **THEN** no script runs and no image element is created from the title
