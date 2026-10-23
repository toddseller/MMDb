# Spec Delta

## MODIFIED Requirements

### Requirement: Artwork tab offers a file upload
The show edit modal's artwork tab SHALL offer a file picker limited to JPEG and PNG, shown as an "Upload" button styled like the dialog's other buttons and attached to the existing poster URL field. A successful upload SHALL put the returned URL in that field and refresh the artwork previews, so the existing Save stores it as the season and show poster. A failed upload SHALL show its message in the tab and leave the field unchanged. Pasting a URL SHALL keep working.

#### Scenario: Picker present
- **WHEN** the owner opens the edit modal for a show
- **THEN** the artwork tab has a file input accepting `image/jpeg,image/png` and still has the `season[poster]` URL field

#### Scenario: Picker is a dialog button on the URL field
- **WHEN** the owner opens the artwork tab
- **THEN** the URL field and an "Upload" button with the dialog's `btn btn-default` styling form one input group, the button is a label for the file input, and the browser's own "Choose File" control is not visible

#### Scenario: Keyboard use
- **WHEN** a keyboard user tabs to the file input
- **THEN** the "Upload" button shows a visible focus ring, and pressing Space or Enter opens the file chooser

#### Scenario: Upload then save
- **WHEN** the owner picks a square file, the upload succeeds, and they press Save
- **THEN** the season's and the show's posters are the returned cdn.myflix.stream URL

#### Scenario: Upload fails
- **WHEN** the upload is rejected
- **THEN** the tab shows the rejection message and the poster URL field keeps its previous value
