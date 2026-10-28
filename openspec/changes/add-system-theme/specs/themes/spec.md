# Spec Delta

## ADDED Requirements

### Requirement: The System theme follows the device
A user who chooses the System theme SHALL see the light theme while their device is set to light and the dark theme while it is set to dark. A change to the device's setting SHALL change the open page without a reload.

#### Scenario: Device set to dark
- **WHEN** a user whose saved theme is System loads a page on a device set to dark
- **THEN** the page is dark

#### Scenario: Device switches while the page is open
- **WHEN** a user on the System theme has a page open and their device switches from light to dark
- **THEN** the page turns dark without a reload

### Requirement: Signed-out visitors get the System theme
A visitor who is not signed in SHALL get the System theme, both on a first visit and after signing out.

#### Scenario: First visit
- **WHEN** a visitor with no session loads the sign-in page on a device set to light
- **THEN** the page is light

#### Scenario: After signing out
- **WHEN** a user whose saved theme is Dark signs out on a device set to light
- **THEN** the next page is light

### Requirement: New accounts start on the System theme
A newly registered account SHALL be saved with the System theme, so its owner sees the same theme they had as a visitor until they choose another.

#### Scenario: Registering
- **WHEN** a visitor registers on a device set to dark
- **THEN** their account's theme is System and the first page after registering is dark
