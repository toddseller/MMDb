# themes Specification

## Purpose
Lets each person see MMDb in the light theme, the dark theme, or whichever their device is set to, with every page, dialog and form looking the same in each apart from its colours.

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

### Requirement: Dialogs and form controls follow the theme
Every dialog, form field and plain button SHALL take its colours from the page's theme. In the dark theme a dialog's box is dark with light text, and its fields sit raised on it: lighter than the box, with a visible edge. The light theme SHALL look as it did before dark dialogs existed. The sign-in dialog's red header, the red action buttons and the focus glow on fields SHALL look the same in both themes, and the red sign-up panel SHALL keep its light fields.

#### Scenario: Account Settings in the dark theme
- **WHEN** a user on the dark theme opens Account Settings
- **THEN** the dialog's box is dark, its text is light, and each field is lighter than the box with a visible edge

#### Scenario: Sign-in on a dark device
- **WHEN** a visitor whose device is set to dark opens the sign-in dialog
- **THEN** the dialog's box and fields are dark, the header is still red with white text, and Remember me's border matches the fields'

#### Scenario: Plain buttons in the dark theme
- **WHEN** a user on the dark theme opens Account Settings
- **THEN** the Theme picker's buttons are dark with light text, and the checked one stands apart from the others

#### Scenario: Disabled field in the dark theme
- **WHEN** a user on the dark theme opens Account Settings before typing a current password
- **THEN** the disabled New Password field is dark and looks different from an enabled field

#### Scenario: Sign-up on a dark device
- **WHEN** a visitor whose device is set to dark opens the sign-up page
- **THEN** its fields and Register button are white on the red panel, as in the light theme

#### Scenario: Light theme unchanged
- **WHEN** a dialog, the registration page or the collection filter box is shown in the light theme
- **THEN** it looks the same as before this change

#### Scenario: System follows the device inside an open dialog
- **WHEN** a user on the System theme has Account Settings open and their device switches from light to dark
- **THEN** the dialog, its fields and its buttons turn dark without a reload
