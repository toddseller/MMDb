# user-account Specification

## Purpose

Lets a visitor sign in and register, and lets a signed-in user sign out and change their name, email, password and theme from Account Settings.

## Requirements

### Requirement: Signing in from the sign-in dialog
The Sign in button SHALL open the sign-in dialog with the user name or email field focused. The dialog SHALL offer a Remember me checkbox, unticked when the dialog opens. Submitting it with the button or Enter SHALL sign the user in without a page reload of the dialog and then load their movie collection.

#### Scenario: Signing in
- **WHEN** a visitor opens the sign-in dialog, enters a valid user name or email and password, and presses Enter
- **THEN** the browser goes to `/users/<their id>` and the navbar reads "Signed in as <their name>"

#### Scenario: The first field is focused
- **WHEN** a visitor opens the sign-in dialog
- **THEN** the user name or email field has focus

#### Scenario: Signing in with Remember me
- **WHEN** a visitor ticks Remember me and signs in
- **THEN** they are signed in as above, and their session lasts 30 days without use instead of 1 day

### Requirement: A refused sign-in is reported in the dialog
When both fields are empty, the dialog SHALL show its error line without contacting the server, whether or not Remember me is ticked. When the server refuses the credentials, the dialog SHALL show the error line and clear both fields. Closing the dialog SHALL clear the fields, untick Remember me and hide the line.

#### Scenario: Wrong password
- **WHEN** a visitor submits a known user name with the wrong password
- **THEN** the dialog stays open, shows "Invalid login. Please check your credentials and try again." and both fields are empty

#### Scenario: Empty form
- **WHEN** a visitor submits the dialog with both fields empty
- **THEN** the error line shows and no sign-in request is sent

#### Scenario: Only Remember me ticked
- **WHEN** a visitor ticks Remember me and submits the dialog with both fields empty
- **THEN** the error line shows and no sign-in request is sent

#### Scenario: Closing clears the dialog
- **WHEN** a visitor types into the dialog, ticks Remember me, closes it and opens it again
- **THEN** both fields are empty, Remember me is unticked and the error line is hidden

### Requirement: Signing out
Sign Out in the menu SHALL end the session and load the home page signed out.

#### Scenario: Signing out
- **WHEN** a signed-in user opens the menu and clicks Sign Out
- **THEN** the browser is on `/` and the navbar shows the Sign in button

### Requirement: Account Settings saves on submit
Account Settings in the menu SHALL open a dialog holding the user's first name, last name, user name, email and theme. Submitting it by the Update button or by Enter SHALL save it; on success the dialog SHALL close and the navbar SHALL read "Signed in as <new full name>" without a reload.

#### Scenario: Changing the name
- **WHEN** a signed-in user changes their first name in Account Settings and presses Enter in that field
- **THEN** the dialog closes and the navbar shows the new name

### Requirement: Changing the password needs the current one
The new and confirm password fields SHALL stay disabled until the current password field has a value; while it has one, Update SHALL stay disabled until the confirm field matches the new password, checked again whenever either field changes. Clearing the current password SHALL enable Update again.

#### Scenario: Matching passwords enable Update
- **WHEN** the user types their current password, a new password and the same in confirm
- **THEN** the confirm field is marked as matching and Update is enabled

#### Scenario: Mismatched passwords
- **WHEN** the confirm field differs from the new password
- **THEN** the confirm field is marked as not matching and Update is disabled

#### Scenario: Editing the new password after a match
- **WHEN** the passwords match and the user then changes the new password
- **THEN** the confirm field is marked as not matching and Update is disabled

### Requirement: A wrong current password is reported in the dialog
When the server refuses the current password, the dialog SHALL stay open, show "Invalid Password.", clear and focus the current password field, and clear and disable the new and confirm fields. Update SHALL be enabled again, as with an empty current password. Nothing SHALL be saved.

#### Scenario: Wrong current password
- **WHEN** the user submits Account Settings with a wrong current password
- **THEN** the dialog stays open with "Invalid Password.", the current password field is empty and focused, and the new and confirm fields are empty and disabled

### Requirement: The theme switch previews the theme
Flipping the theme switch SHALL show the page in that theme at once, by replacing the page's one theme stylesheet with the other theme's versioned stylesheet. The page SHALL NOT gain a stylesheet per flip.

#### Scenario: Flipping to dark
- **WHEN** a user on the light theme flips the switch in Account Settings
- **THEN** the page is dark and the page has exactly one theme stylesheet

### Requirement: An unsaved theme does not outlive the dialog
Closing Account Settings without a successful Update SHALL put back the theme the user last saved.

#### Scenario: Flipping and closing
- **WHEN** a user on the light theme flips the switch and closes Account Settings without Update
- **THEN** the page is light again

#### Scenario: Flipping and saving
- **WHEN** a user on the light theme flips the switch, presses Update and reloads the page
- **THEN** the page is dark

### Requirement: The light theme is saved when the switch is off
Saving Account Settings with the theme switch off SHALL store the light theme, so later pages load light.

#### Scenario: Turning the dark theme off
- **WHEN** a user on the dark theme turns the switch off, presses Update and reloads the page
- **THEN** the page is light

### Requirement: Registration checks the passwords match
On the registration page, once the user stops typing in either password field for 1.5 seconds, the page SHALL compare it with the password. A match SHALL enable Register and hide any warning; a mismatch SHALL show "Passwords do not match" and disable Register. Only the last pause SHALL be checked.

#### Scenario: Mismatch
- **WHEN** a visitor types a password and a different confirmation, then pauses
- **THEN** "Passwords do not match" shows and Register is disabled

#### Scenario: Match
- **WHEN** a visitor types the same password in both fields, then pauses
- **THEN** the warning is hidden and Register is enabled

#### Scenario: Changing the password after a match
- **WHEN** the passwords match and the visitor then changes the password, then pauses
- **THEN** "Passwords do not match" shows and Register is disabled

### Requirement: A web session ends after a period without use
A web session SHALL end 1 day after its last request, or 30 days after its last request when Remember me was ticked at sign-in. Every request made while the session is live SHALL move its end to the full lifetime after that request, and the session cookie's expiry with it. A session that has ended SHALL be treated as signed out from its next request on: pages show the Sign in button, and writes answer 401.

#### Scenario: Idle for more than a day
- **WHEN** a user signs in without Remember me and makes no request for 25 hours
- **THEN** their next page shows the Sign in button, and a write from that browser answers 401

#### Scenario: Used every day
- **WHEN** a user signs in without Remember me and opens a page every 20 hours for a week
- **THEN** they are still signed in at the end of the week

#### Scenario: Remembered sign-in
- **WHEN** a user signs in with Remember me and makes no request for 29 days
- **THEN** they are still signed in, and the session now ends 30 days after that request

#### Scenario: The cookie's expiry moves too
- **WHEN** a signed-in user opens a page
- **THEN** the response's session cookie expires one lifetime after that request

### Requirement: Sessions without an end time get the 1-day lifetime
A signed-in session that has no end time (one from before this change, or one started by registering or by the v2 or v3 login) SHALL be given the 1-day lifetime on its next request, and SHALL NOT be signed out by that request.

#### Scenario: A session from before the change
- **WHEN** a browser signed in before this change opens a page
- **THEN** it is still signed in, and its session ends 1 day after that request unless used again

#### Scenario: Registering
- **WHEN** a visitor registers and then opens a page
- **THEN** they are signed in with the 1-day lifetime

### Requirement: The session cookie is same-site, and secure over HTTPS
The session cookie SHALL be sent with `SameSite=Lax` and `HttpOnly`. When the request reached the site over HTTPS, directly or as reported by the proxy in front of it, the cookie SHALL also be `Secure`. Over plain HTTP it SHALL NOT be `Secure`, so local and browser-test servers keep working and a missing proxy header never stops a sign-in.

#### Scenario: Through Cloudflare
- **WHEN** a user signs in on https://mmdb.online
- **THEN** the session cookie is `HttpOnly`, `SameSite=Lax` and `Secure`

#### Scenario: Plain HTTP
- **WHEN** a user signs in on a local server over plain HTTP
- **THEN** the session cookie is `HttpOnly` and `SameSite=Lax`, not `Secure`, and the user is signed in

### Requirement: Requests without a session get no session cookie
A request that carries no session cookie SHALL get no session cookie in its response from the session check, so other sites' API calls are unchanged.

#### Scenario: toddseller.com's counts
- **WHEN** toddseller.com requests `/api/movies/count` or `/api/year` with no MMDb cookie
- **THEN** the response sets no cookie, as before
