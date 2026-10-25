# Spec Delta

## MODIFIED Requirements

### Requirement: Long episode plots expand and collapse
An episode plot that does not fit the space it is shown in SHALL be shown cut off, with a "more" control below it; a plot that fits SHALL show whole, with no "more". Whether it fits SHALL be judged on screen, and again when the drawer's content changes or the window is resized. On a phone a plot SHALL show up to three lines. Clicking "more" SHALL show the full plot and read "less"; clicking "less" SHALL cut it off again and read "more".

#### Scenario: Expanding and collapsing a plot
- **WHEN** the user opens a show's details, clicks "more" under a long episode plot, then clicks "less"
- **THEN** the plot shows in full while the control reads "less", and is truncated again once it reads "more"

#### Scenario: A plot that fits
- **WHEN** a show's details are open on a 390px wide window and an episode's plot is longer than one line but fits in three
- **THEN** the whole plot shows, with no "more" under it

#### Scenario: Three lines on a phone
- **WHEN** a show's details are open on a 390px wide window
- **THEN** each episode plot shows up to three lines, and a "more" under a longer one sits below the plot's text, not over it
