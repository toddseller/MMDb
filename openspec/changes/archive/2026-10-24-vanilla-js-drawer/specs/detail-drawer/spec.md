## ADDED Requirements

### Requirement: The drawer eases open and closed to fit its content
The drawer SHALL grow from closed to the height of its content when it opens, and shrink back to closed when it closes, easing in both directions. Content that grows after opening, such as images loading, SHALL make the drawer grow with it.

#### Scenario: Opening
- **WHEN** a drawer opens
- **THEN** it is first shown closed, then grows to its content's height without pausing at full size

#### Scenario: Closing by clicking the poster again
- **WHEN** the user clicks the poster of the open drawer
- **THEN** the drawer shrinks closed, and clicking the same poster then opens it again with one click

## REMOVED Requirements

### Requirement: The drawer eases open and closed to its content's height
**Reason**: It described closing the drawer with a close button, which the drawer doesn't have.
**Migration**: Replaced by "The drawer eases open and closed to fit its content", the same behaviour with closing by clicking the poster again.
