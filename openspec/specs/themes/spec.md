# themes Specification

## Purpose
TBD - created by archiving change merge-theme-stylesheets. Update Purpose after archive.

## Requirements

### Requirement: The light and dark themes share one layout
Every page SHALL lay out the same in the light and the dark theme: the same elements at the same sizes and positions, at every window width. The themes SHALL differ only in colour. A layout fix SHALL therefore reach both themes at once.

#### Scenario: The ratings row on a phone
- **WHEN** a user on a 390px wide window opens a movie's drawer, in either theme
- **THEN** the rating, runtime and genre sit side by side without overlapping

#### Scenario: The show edit dialog's HD switch
- **WHEN** the owner opens a show's edit dialog, in either theme
- **THEN** the HD/Standard switch is styled as a switch, not shown as a bare checkbox

#### Scenario: Same boxes in both themes
- **WHEN** the same page is shown in the light theme and then in the dark theme, at the same window size
- **THEN** every element on it has the same size and position in both

### Requirement: Native controls follow the theme
The page SHALL tell the browser which theme it is in, so the browser's own scrollbars and form controls are drawn light in the light theme and dark in the dark theme.

#### Scenario: Dark theme scrollbar
- **WHEN** a user on the dark theme scrolls the movies page
- **THEN** the browser draws its scrollbar dark

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
