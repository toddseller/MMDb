# Spec Delta

## ADDED Requirements

### Requirement: Browsing dialogs fit a phone screen
Below the phone breakpoint, the sign-in dialog and a movie's details dialog SHALL fit within the screen's width, with the details poster above the details, and SHALL scroll inside the dialog when their content is taller than the screen. Their close button SHALL stay reachable.

#### Scenario: Details from the home page on a phone
- **WHEN** a visitor on a 390px wide window taps a poster on the home page
- **THEN** the details dialog is no wider than the screen, its × button is on screen, and the page does not scroll sideways

#### Scenario: Signing in on a phone
- **WHEN** a visitor on a 390px wide window opens Sign in
- **THEN** both fields and the Sign in button are within the screen
