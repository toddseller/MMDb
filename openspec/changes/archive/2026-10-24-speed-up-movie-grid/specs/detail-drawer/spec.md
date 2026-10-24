# Spec Delta

## ADDED Requirements

### Requirement: The drawer stays smooth in large collections
Opening, switching and closing the drawer SHALL keep frames short in a grid of thousands of posters, by not rendering tiles far from the screen. Scrolling the grid SHALL NOT freeze.

#### Scenario: Thousands of movies
- **WHEN** a drawer opens in a grid of 4,526 movies on a desktop browser
- **THEN** the median frame during the animation is under 25ms, close to the shows grid's 17ms

#### Scenario: Long scroll
- **WHEN** the user jumps from the top of a 4,526-movie grid to the middle
- **THEN** the page shows the new posters without freezing
