## ADDED Requirements

### Requirement: The artwork preview fits the Artwork tab
The Artwork tab's preview SHALL show the whole image within the dialog, whatever the image's shape. An image too tall for the tab SHALL be scaled down to fit, keeping its proportions, and centred across the tab's width. The poster URL field, the Upload button, and the dialog's OK and Cancel buttons SHALL stay visible and clickable. Artwork that already fits SHALL be shown at the tab's full width as before.

#### Scenario: Vertical poster
- **WHEN** the owner opens the Artwork tab of a show whose season artwork is a 2:3 poster
- **THEN** the whole poster is shown inside the dialog's body with its proportions kept
- **AND** the poster URL field, the Upload button, and the OK and Cancel buttons can be clicked

#### Scenario: Landscape artwork
- **WHEN** the owner opens the Artwork tab of a show whose season artwork is 16:9
- **THEN** the artwork fills the tab's width, as it did before this change
