# details-links Specification

## Purpose

Defines what the links inside a details drawer do: a movie's credits and studio search the collection for that name, and a long episode plot expands and collapses.

## Requirements

### Requirement: Clicking a name in a movie's details searches the collection for it
A movie's details list its actors, directors, writers, producers and studio as links. Clicking one SHALL send a single search request. The search SHALL return the movies in the collection that credit that name. The links SHALL NOT navigate. The movie list SHALL be replaced with the results. Above the list, a profile header SHALL show the name, with the person's picture when the movie database has one. The title search box SHALL be cleared.

#### Scenario: Clicking an actor
- **WHEN** the user opens a movie's details and clicks an actor's name
- **THEN** the page stays where it is, the list shows only the collection's movies with that actor, and the profile header shows the actor's name and picture

#### Scenario: A name without a picture
- **WHEN** the user clicks a name the movie database has no picture for
- **THEN** the profile header shows the name centred, with no picture

#### Scenario: Clicking the studio
- **WHEN** the user clicks a movie's studio
- **THEN** exactly one search request is sent, and the list shows the collection's movies from that studio

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
