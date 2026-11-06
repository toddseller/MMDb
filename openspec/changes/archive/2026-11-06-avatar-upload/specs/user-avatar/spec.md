## Purpose

Defines how a user changes their avatar through the API: who may, which files are accepted, where the file is stored, and what the user record and response hold afterwards.

## ADDED Requirements

### Requirement: A signed-in user uploads their avatar
`POST /api/v2/avatar` with a valid sign-in token and a JPEG or PNG file of up to 5 MB in the `avatar` field SHALL store the file publicly under a new, unique name in the `avatars/` folder of the `myflix-stream` bucket, SHALL save its URL on cdn.myflix.stream as that user's avatar, and SHALL answer 200 with that URL. Only the token's user SHALL change.

#### Scenario: JPEG upload
- **WHEN** a signed-in user uploads a JPEG as their avatar
- **THEN** the response is 200 with a JSON `avatar` of the form `https://cdn.myflix.stream/avatars/<name>.jpg`
- **AND** the file's bytes are stored at `avatars/<name>.jpg` in the `myflix-stream` bucket with content type `image/jpeg`
- **AND** the user's avatar is that URL, and no other user's avatar changed

#### Scenario: PNG upload
- **WHEN** a signed-in user uploads a PNG
- **THEN** the URL ends in `.png` and the object is stored with content type `image/png`

#### Scenario: The next sign-in
- **WHEN** a user who uploaded an avatar signs in again
- **THEN** the sign-in response's user carries the new avatar URL

### Requirement: Only a valid sign-in can change an avatar
An avatar upload without a valid sign-in token SHALL answer 401, store nothing and change no avatar.

#### Scenario: No token
- **WHEN** an avatar is uploaded with no `Authorization` header
- **THEN** the response is 401, nothing is stored, and no avatar changes

#### Scenario: An expired or forged token
- **WHEN** an avatar is uploaded with an expired token or one not signed by MMDb
- **THEN** the response is 401, nothing is stored, and no avatar changes

### Requirement: Only real JPEG and PNG avatars within the size limit are accepted
The type SHALL be judged by the file's leading bytes, not its name or declared type. An upload that is missing, not a JPEG or PNG, or larger than 5 MB SHALL answer 422 with a readable message, store nothing and leave the avatar unchanged.

#### Scenario: Disguised file
- **WHEN** a text file named `me.jpg` and declared as `image/jpeg` is uploaded
- **THEN** the response is 422 saying only JPEG and PNG are accepted, and the avatar is unchanged

#### Scenario: Too large
- **WHEN** a JPEG larger than 5 MB is uploaded
- **THEN** the response is 422 with a message naming the 5 MB limit, and the avatar is unchanged

#### Scenario: No file
- **WHEN** the request carries no `avatar` file
- **THEN** the response is 422 and the avatar is unchanged

### Requirement: Avatar storage failures are reported
When the file can't be stored, the upload SHALL answer 502 with a readable message, SHALL leave the avatar unchanged, and SHALL NOT expose credentials or storage error details.

#### Scenario: Storage refuses the file
- **WHEN** storage answers the upload with an error
- **THEN** the response is 502 saying the avatar couldn't be stored, and the avatar is unchanged

### Requirement: Myflix may upload avatars
The endpoint SHALL accept cross-origin requests from Myflix's origins (`myflix.stream`, `www.myflix.stream` and `localhost:3000`), as the rest of `/api/v2` does.

#### Scenario: From myflix.stream
- **WHEN** myflix.stream's page sends the upload, after the browser's preflight
- **THEN** the preflight allows the `POST` with an `Authorization` header from that origin
