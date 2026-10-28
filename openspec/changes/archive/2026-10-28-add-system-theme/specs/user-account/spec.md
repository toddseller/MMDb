# Spec Delta

## ADDED Requirements

### Requirement: The theme choice previews the theme
Account Settings SHALL offer three theme choices, Light, Dark and System, with the saved one selected. Picking a choice SHALL show the page in that theme at once, without loading another stylesheet.

#### Scenario: Picking Dark
- **WHEN** a user on the light theme picks Dark in Account Settings
- **THEN** the page is dark and the page still has exactly one stylesheet

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

## MODIFIED Requirements

### Requirement: A wrong current password is reported in the dialog
When the server refuses the save, for a wrong current password or for an email or user name another account has, the dialog SHALL stay open, show "Couldn't save. Check your current password, email and user name.", clear and focus the current password field, and clear and disable the new and confirm fields. Update SHALL be enabled again, as with an empty current password. Nothing SHALL be saved.

#### Scenario: Wrong current password
- **WHEN** the user submits Account Settings with a wrong current password
- **THEN** the dialog stays open with "Couldn't save. Check your current password, email and user name.", the current password field is empty and focused, and the new and confirm fields are empty and disabled

#### Scenario: Taken email
- **WHEN** the user changes their email to one another account has and submits Account Settings
- **THEN** the dialog stays open with the same message, and the email is not saved

### Requirement: An unsaved theme does not outlive the dialog
Closing Account Settings without a successful Update SHALL put back the theme the user last saved, and the saved choice SHALL be selected the next time the dialog opens.

#### Scenario: Flipping and closing
- **WHEN** a user on the light theme picks Dark and closes Account Settings without Update
- **THEN** the page is light again

#### Scenario: Flipping and saving
- **WHEN** a user on the light theme picks Dark, presses Update and reloads the page
- **THEN** the page is dark

## REMOVED Requirements

### Requirement: The theme switch previews the theme
**Reason**: The on/off switch becomes a three-way choice, and the page no longer swaps stylesheets.
**Migration**: Covered by "The theme choice previews the theme".

### Requirement: The light theme is saved when the switch is off
**Reason**: There is no switch to turn off; every choice is sent explicitly.
**Migration**: Covered by "The chosen theme is saved".
