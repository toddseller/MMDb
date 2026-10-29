## MODIFIED Requirements

### Requirement: Changing the password needs the current one
The new and confirm password fields SHALL stay disabled until the current password field has a value; while it has one, Update SHALL stay disabled until the new password has at least 8 characters and the confirm field matches it, checked again whenever either field changes. While the new password is shorter, the dialog SHALL say "Use at least 8 characters"; while it is long enough but the confirm field differs, it SHALL say "Passwords do not match"; once both hold, neither message SHALL show. Characters SHALL be counted as the server counts them, so a character outside the basic range counts once. Clearing the current password SHALL enable Update again.

#### Scenario: Matching passwords enable Update
- **WHEN** the user types their current password, a new password of 8 or more characters and the same in confirm
- **THEN** the confirm field is marked as matching, no message shows and Update is enabled

#### Scenario: Mismatched passwords
- **WHEN** the new password has 8 or more characters and the confirm field differs from it
- **THEN** the confirm field is marked as not matching, "Passwords do not match" shows and Update is disabled

#### Scenario: New password too short
- **WHEN** the user types a 7-character new password and the same in confirm
- **THEN** "Use at least 8 characters" shows, the confirm field is not marked as matching and Update is disabled

#### Scenario: Editing the new password after a match
- **WHEN** the passwords match and the user then changes the new password
- **THEN** the confirm field is marked as not matching and Update is disabled

### Requirement: A wrong current password is reported in the dialog
When the server refuses the save, for a wrong current password, a new password outside the length rule, or an email or user name another account has, the dialog SHALL stay open, show "Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters.", clear and focus the current password field, and clear and disable the new and confirm fields. Update SHALL be enabled again, as with an empty current password. Nothing SHALL be saved.

#### Scenario: Wrong current password
- **WHEN** the user submits Account Settings with a wrong current password
- **THEN** the dialog stays open with "Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters.", the current password field is empty and focused, and the new and confirm fields are empty and disabled

#### Scenario: Taken email
- **WHEN** the user changes their email to one another account has and submits Account Settings
- **THEN** the dialog stays open with the same message, and the email is not saved

#### Scenario: New password too short
- **WHEN** an Account Settings save with the right current password and a 7-character new password reaches the server, for example from a page loaded before the dialog checked the length
- **THEN** the dialog stays open with the same message, and the password is unchanged

#### Scenario: New password too long
- **WHEN** the user submits Account Settings with the right current password and a new password of 73 bytes
- **THEN** the dialog stays open with the same message, and the password is unchanged

### Requirement: Registration checks the passwords match
On the registration page, once the user stops typing in either password field for 1.5 seconds, the page SHALL check the password's length and compare the confirmation with it. A password shorter than 8 characters SHALL show "Use at least 8 characters" and disable Register; otherwise a mismatch SHALL show "Passwords do not match" and disable Register; a long enough password that matches SHALL enable Register and hide any warning. Characters SHALL be counted as the server counts them. Only the last pause SHALL be checked.

#### Scenario: Mismatch
- **WHEN** a visitor types a password of 8 or more characters and a different confirmation, then pauses
- **THEN** "Passwords do not match" shows and Register is disabled

#### Scenario: Too short
- **WHEN** a visitor types a 7-character password and the same confirmation, then pauses
- **THEN** "Use at least 8 characters" shows and Register is disabled

#### Scenario: Match
- **WHEN** a visitor types the same password of 8 or more characters in both fields, then pauses
- **THEN** the warning is hidden and Register is enabled

#### Scenario: Changing the password after a match
- **WHEN** the passwords match and the visitor then changes the password, then pauses
- **THEN** "Passwords do not match" shows and Register is disabled

### Requirement: A new password is 8 characters to 72 bytes
Registration, Account Settings and `/api/v2` and `/api/v3` signup SHALL refuse a new password shorter than 8 characters or longer than 72 bytes, save nothing, and give the reason where that path already reports errors. This holds for requests that skip the pages' own checks. No rule SHALL require particular kinds of characters. A password set before this rule SHALL keep working until it is changed.

#### Scenario: Empty password at registration
- **WHEN** a registration request arrives with an empty password
- **THEN** no account is created and the registration page says the password is too short

#### Scenario: Short new password in Account Settings
- **WHEN** an Account Settings save arrives with the right current password and a 7-character new password
- **THEN** the save is refused and the password is unchanged

#### Scenario: Too long through the API
- **WHEN** a visitor signs up through `/api/v3/signup` with a 73-byte password
- **THEN** the response is a 422 naming the password, and no account is created

#### Scenario: Within the limits
- **WHEN** a visitor registers with an 8-character password, or a 72-byte one
- **THEN** the account is created and the password signs in

## ADDED Requirements

### Requirement: The account forms name their fields
In the sign-in dialog, Account Settings and the registration page, every text and password field SHALL be named by its visible label, so that the label focuses it and assistive technology reads it. Each field SHALL tell the browser what it holds: user names and the sign-in "User Name or Email" field `username`, email `email`, first name `given-name`, last name `family-name`, sign-in and current passwords `current-password`, new and confirm passwords `new-password`.

#### Scenario: A label focuses its field
- **WHEN** a user clicks the "Current Password:" label in Account Settings
- **THEN** the current password field has focus

#### Scenario: A password manager knows the new password
- **WHEN** a password manager reads Account Settings
- **THEN** the current password field is marked `current-password` and the new and confirm fields `new-password`

### Requirement: Password placeholders say what the field needs
In Account Settings the current password's placeholder SHALL be "Only needed to change your password". The new password's placeholder in Account Settings and on the registration page SHALL be "At least 8 characters".

#### Scenario: The new password states the minimum
- **WHEN** a visitor opens the registration page
- **THEN** the password field's placeholder reads "At least 8 characters"

#### Scenario: The current password says when it is needed
- **WHEN** a user opens Account Settings
- **THEN** the current password field's placeholder reads "Only needed to change your password"
