# Spec Delta

## ADDED Requirements

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
