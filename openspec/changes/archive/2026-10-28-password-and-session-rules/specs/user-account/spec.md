# Spec Delta

## ADDED Requirements

### Requirement: A new password is 8 characters to 72 bytes
Registration, Account Settings and `/api/v2` and `/api/v3` signup SHALL refuse a new password shorter than 8 characters or longer than 72 bytes, save nothing, and give the reason where that path already reports errors. No rule SHALL require particular kinds of characters. A password set before this rule SHALL keep working until it is changed.

#### Scenario: Empty password at registration
- **WHEN** a visitor registers with an empty password and an empty confirmation
- **THEN** no account is created and the registration page says the password is too short

#### Scenario: Short new password in Account Settings
- **WHEN** a user enters their current password and a 7-character new password in Account Settings
- **THEN** the save is refused, the dialog shows its error message and the password is unchanged

#### Scenario: Too long through the API
- **WHEN** a visitor signs up through `/api/v3/signup` with a 73-byte password
- **THEN** the response is a 422 naming the password, and no account is created

#### Scenario: Within the limits
- **WHEN** a visitor registers with an 8-character password, or a 72-byte one
- **THEN** the account is created and the password signs in

### Requirement: Changing the password ends the account's other sessions
After a user's password changes, every web session that signed in before the change SHALL be signed out on its next request, and every API token issued before the change SHALL be rejected. The browser that made the change SHALL stay signed in. A web session from before this rule existed SHALL be signed out on its next request.

#### Scenario: Another browser
- **WHEN** a user is signed in on two browsers and changes their password in one
- **THEN** the other browser's next request is treated as signed out, and the first stays signed in

#### Scenario: A session from before this rule
- **WHEN** a browser presents a session cookie issued before this rule existed
- **THEN** the request is treated as signed out

#### Scenario: Changing other settings
- **WHEN** a user saves Account Settings without changing their password
- **THEN** their other sessions stay signed in

## MODIFIED Requirements

### Requirement: A wrong current password is reported in the dialog
When the server refuses the save, for a wrong current password, a new password outside the length rule, or an email or user name another account has, the dialog SHALL stay open, show "Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters.", clear and focus the current password field, and clear and disable the new and confirm fields. Update SHALL be enabled again, as with an empty current password. Nothing SHALL be saved.

#### Scenario: Wrong current password
- **WHEN** the user submits Account Settings with a wrong current password
- **THEN** the dialog stays open with "Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters.", the current password field is empty and focused, and the new and confirm fields are empty and disabled

#### Scenario: Taken email
- **WHEN** the user changes their email to one another account has and submits Account Settings
- **THEN** the dialog stays open with the same message, and the email is not saved

#### Scenario: New password too short
- **WHEN** the user submits Account Settings with the right current password and a new password of 7 characters
- **THEN** the dialog stays open with the same message, and the password is unchanged
