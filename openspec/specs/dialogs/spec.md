# dialogs Specification

## Purpose

Defines how the site's dialogs (sign-in and Account Settings, a movie's details, and show edit) open and close: which field has focus, the ways to close one, the fade, and the page behind staying put.

## Requirements

### Requirement: An open dialog keeps the page behind out of reach
While a dialog is open, the page behind SHALL be dimmed, SHALL NOT scroll, and SHALL NOT take clicks or keyboard focus. Focus SHALL go to the dialog's `autofocus` field when it has one.

#### Scenario: Scrolling behind a dialog
- **WHEN** a dialog is open over a long collection and the visitor scrolls
- **THEN** the page behind stays where it was

#### Scenario: Tabbing inside a dialog
- **WHEN** the sign-in dialog is open and the visitor presses Tab repeatedly
- **THEN** focus never reaches a control on the page behind

### Requirement: A dialog closes by its close button or Escape, not by a click outside
A dialog's × button and the Escape key SHALL close it. A click on the dimmed page outside the dialog SHALL leave it open, so a stray click can't throw away unsaved edits. Closing SHALL return focus to whatever had it before the dialog opened, when that is still on the page.

#### Scenario: Escape closes sign-in
- **WHEN** a visitor focuses the Sign in button from the keyboard, opens the dialog with Enter, and presses Escape
- **THEN** the dialog closes, and the Sign in button has focus

#### Scenario: A click outside does nothing
- **WHEN** a movie's details dialog is open and the visitor clicks the dimmed page beside it
- **THEN** the dialog stays open

#### Scenario: The close button
- **WHEN** a movie's details dialog is open and the visitor clicks its × button
- **THEN** the dialog closes

### Requirement: Dialogs fade in and out
Opening a dialog SHALL fade it and the dim layer in; closing it by any means SHALL fade both out, and the dialog SHALL stay in place until the fade has finished. When the visitor's system asks for reduced motion, dialogs SHALL open and close at once.

#### Scenario: Closing fades out
- **WHEN** an open dialog is closed with Escape
- **THEN** it is still shown, fading, for a moment, and then it is gone

#### Scenario: Reduced motion
- **WHEN** the visitor's system asks for reduced motion and they close a dialog
- **THEN** it is gone at once

#### Scenario: Reopened while fading out
- **WHEN** a dialog is opened again before its fade-out has finished
- **THEN** it stays open

### Requirement: The page loads no script library for its own features
The site's pages SHALL load no third-party script for their own behavior; only analytics scripts come from other hosts.

#### Scenario: No jQuery
- **WHEN** a signed-in user's collection page loads
- **THEN** the page has no `jQuery` and requests no script from Google's library CDN

### Requirement: Browsing dialogs fit a phone screen
Below the phone breakpoint, the sign-in dialog and a movie's details dialog SHALL fit within the screen's width, with the details poster above the details, and SHALL scroll inside the dialog when their content is taller than the screen. Their close button SHALL stay reachable.

#### Scenario: Details from the home page on a phone
- **WHEN** a visitor on a 390px wide window taps a poster on the home page
- **THEN** the details dialog is no wider than the screen, its × button is on screen, and the page does not scroll sideways

#### Scenario: Signing in on a phone
- **WHEN** a visitor on a 390px wide window opens Sign in
- **THEN** both fields and the Sign in button are within the screen
