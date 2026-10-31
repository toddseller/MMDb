# Spec Delta

## MODIFIED Requirements

### Requirement: Signing in from the sign-in dialog
The Sign in button SHALL open the sign-in dialog with the user name or email field focused. The dialog SHALL offer a Remember me checkbox, unticked when the dialog opens. Submitting it with the button or Enter SHALL sign the user in without a page reload of the dialog and then load their movie collection at its handle's address.

#### Scenario: Signing in
- **WHEN** a visitor opens the sign-in dialog, enters a valid user name or email and password, and presses Enter
- **THEN** the browser goes to `/u/<their handle>` and the navbar reads "Signed in as <their name>"

#### Scenario: The first field is focused
- **WHEN** a visitor opens the sign-in dialog
- **THEN** the user name or email field has focus

#### Scenario: Signing in with Remember me
- **WHEN** a visitor ticks Remember me and signs in
- **THEN** they are signed in as above, and their session lasts 30 days without use instead of 1 day
