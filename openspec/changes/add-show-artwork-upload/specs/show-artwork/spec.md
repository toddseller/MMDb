# Spec Delta

## Purpose

Lets the owner of a show replace its season and show artwork by uploading an image file they designed, so the artwork no longer has to be uploaded to storage by hand and its link pasted in.

## ADDED Requirements

### Requirement: Owner uploads show artwork
The signed-in owner of a show SHALL be able to upload a JPEG or PNG file of up to 5 MB as that show's artwork. The system SHALL store the file publicly under a new, unique name and answer with its public URL on cdn.myflix.stream. Uploading SHALL NOT change any stored poster by itself.

#### Scenario: JPEG upload
- **WHEN** the owner uploads a 600x600 JPEG for one of their shows
- **THEN** the response is 200 with a JSON `url` of the form `https://cdn.myflix.stream/images/<name>.jpg`
- **AND** the file's bytes are stored at `images/<name>.jpg` in the `myflix-stream` bucket with content type `image/jpeg`
- **AND** the show's and season's stored posters are unchanged

#### Scenario: PNG upload
- **WHEN** the owner uploads a PNG
- **THEN** the URL ends in `.png` and the object is stored with content type `image/png`

#### Scenario: Two uploads never collide
- **WHEN** the owner uploads the same file twice
- **THEN** the two responses carry different URLs

### Requirement: Only the show's owner can upload
An artwork upload SHALL be refused with 401, and nothing stored, unless the request comes from a signed-in user who is the user in the URL and has the show in their collection.

#### Scenario: Not signed in
- **WHEN** a visitor who is not signed in uploads artwork
- **THEN** the response is 401 and nothing is stored

#### Scenario: Another user's show
- **WHEN** a signed-in user uploads artwork for a show that is not in their collection, or under another user's URL
- **THEN** the response is 401 and nothing is stored

### Requirement: Only real JPEG and PNG files within the size limit are accepted
The system SHALL judge a file's type by its leading bytes, not its name or declared type, and SHALL reject with 422 and a readable message, storing nothing, any upload that is missing, not a JPEG or PNG, or larger than 5 MB.

#### Scenario: Disguised file
- **WHEN** a text file named `poster.jpg` and declared as `image/jpeg` is uploaded
- **THEN** the response is 422 with a message saying only JPEG and PNG are accepted, and nothing is stored

#### Scenario: Too large
- **WHEN** a JPEG larger than 5 MB is uploaded
- **THEN** the response is 422 with a message naming the 5 MB limit, and nothing is stored

#### Scenario: No file
- **WHEN** the upload request carries no file
- **THEN** the response is 422 and nothing is stored

### Requirement: Storage failures are reported
When the file cannot be stored, the upload SHALL answer 502 with a readable message and SHALL NOT expose credentials or storage error details.

#### Scenario: Storage refuses the file
- **WHEN** storage answers an upload with an error
- **THEN** the response is 502 with a message that the artwork couldn't be stored, and no stored poster changes

### Requirement: Artwork tab offers a file upload
The show edit modal's artwork tab SHALL offer a file picker limited to JPEG and PNG next to the existing poster URL field. A successful upload SHALL put the returned URL in that field and refresh the artwork previews, so the existing Save stores it as the season and show poster. A failed upload SHALL show its message in the tab and leave the field unchanged. Pasting a URL SHALL keep working.

#### Scenario: Picker present
- **WHEN** the owner opens the edit modal for a show
- **THEN** the artwork tab has a file input accepting `image/jpeg,image/png` and still has the `season[poster]` URL field

#### Scenario: Upload then save
- **WHEN** the owner picks a square file, the upload succeeds, and they press Save
- **THEN** the season's and the show's posters are the returned cdn.myflix.stream URL

#### Scenario: Upload fails
- **WHEN** the upload is rejected
- **THEN** the tab shows the rejection message and the poster URL field keeps its previous value
