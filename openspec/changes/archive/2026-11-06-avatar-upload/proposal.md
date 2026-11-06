# Proposal

## Why

Myflix (myflix.stream) is getting an account settings page where a user can change their avatar. Myflix is static files with no server of its own, so it can't hold AWS credentials; the file has to go through MMDb, which already stores show artwork in the `myflix-stream` bucket and serves it from cdn.myflix.stream. A user's `avatar` today is only a URL column, and MMDb's API has no way to change it.

## What Changes

- A new API endpoint, `POST /api/v2/avatar`, for the user a sign-in token belongs to. It takes a JPEG or PNG of up to 5 MB, stores it publicly under `avatars/` in the `myflix-stream` bucket with a new random name, saves its cdn.myflix.stream URL as the user's avatar, and answers with that URL.
- The same file rules as show artwork: the type is judged by the file's leading bytes, and a missing, wrong or oversized file is refused with 422 and a readable message. A storage failure answers 502 and leaves the avatar unchanged. No valid token answers 401.
- `Artwork.store` takes the folder to store in, so avatars and show artwork share one checked upload path. Show artwork's behaviour and messages don't change.
- AWS, done by the owner: the `mmdb-artwork` IAM user may also put objects under `avatars/*`, and public reads cover `avatars/` if the bucket's policy names folders.

Out of scope: deleting a replaced avatar's file (the IAM user can't delete, by design), changing other account details through the API, and an avatar upload on MMDb's own pages.

## Capabilities

### New Capabilities
- `user-avatar`: uploading a user's avatar through the API: who may, which files are accepted, where it is stored, and what the user record and response hold afterwards.

### Modified Capabilities

None.

## Impact

- `app/controllers/api_v2_controller.rb`: the `POST /avatar` route.
- `app/models/artwork.rb`: a `folder:` keyword (default `images`) and a name for the size message.
- New `spec/avatar_upload_spec.rb`; `spec/artwork_upload_spec.rb` keeps passing unchanged.
- AWS: the IAM policy for `mmdb-artwork`, and possibly the bucket policy. No new gems, no migration (the `avatar` column exists).
- Consumers: Myflix's coming `account-settings` change.
