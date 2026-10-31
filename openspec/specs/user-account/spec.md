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

### Requirement: An unsaved theme does not outlive the dialog
Closing Account Settings without a successful Update SHALL put back the theme the user last saved, and the saved choice SHALL be selected the next time the dialog opens.

#### Scenario: Flipping and closing
- **WHEN** a user on the light theme picks Dark and closes Account Settings without Update
- **THEN** the page is light again

#### Scenario: Flipping and saving
- **WHEN** a user on the light theme picks Dark, presses Update and reloads the page
- **THEN** the page is dark

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

### Requirement: The theme choice previews the theme
Account Settings SHALL offer three theme choices, Light, Dark and System, with the saved one selected. Picking a choice SHALL show the page in that theme at once, without loading another stylesheet.

#### Scenario: Picking Dark
- **WHEN** a user on the light theme picks Dark in Account Settings
- **THEN** the page is dark and has the same stylesheets it had before the pick

#### Scenario: Picking System
- **WHEN** a user on the dark theme, on a device set to light, picks System
- **THEN** the page is light

### Requirement: The chosen theme is saved
Saving Account Settings SHALL store the chosen theme, so later pages load in it. The server SHALL store only Light, Dark or System and SHALL refuse any other value, leaving the saved theme as it was.

#### Scenario: Saving Light
- **WHEN** a user on the dark theme picks Light, presses Update and reloads the page
- **THEN** the page is light

#### Scenario: Saving System
- **WHEN** a user picks System, presses Update and reloads the page on a device set to dark
- **THEN** the page is dark

#### Scenario: An unknown value
- **WHEN** a request saves Account Settings with a theme other than Light, Dark or System
- **THEN** the save is refused and the user's saved theme is unchanged

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
