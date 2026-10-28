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
