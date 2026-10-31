# Spec Delta

## MODIFIED Requirements

### Requirement: The theme choice previews the theme
Account Settings SHALL offer three theme choices, Light, Dark and System, with the saved one selected. Picking a choice SHALL show the page in that theme at once, without loading another stylesheet.

#### Scenario: Picking Dark
- **WHEN** a user on the light theme picks Dark in Account Settings
- **THEN** the page is dark and has the same stylesheets it had before the pick

#### Scenario: Picking System
- **WHEN** a user on the dark theme, on a device set to light, picks System
- **THEN** the page is light
