## ADDED Requirements

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
An episode plot longer than 130 characters SHALL be shown truncated, with a "more" control below it. Clicking "more" SHALL show the full plot, and the control SHALL then read "less". Clicking "less" SHALL truncate the plot again, and the control SHALL read "more" again.

#### Scenario: Expanding and collapsing a plot
- **WHEN** the user opens a show's details, clicks "more" under a long episode plot, then clicks "less"
- **THEN** the plot shows in full while the control reads "less", and is truncated again once it reads "more"
