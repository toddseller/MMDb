# Proposal

## Why

Shows and seasons imported from TMDB get a portrait poster, but the collection uses square artwork. Today the owner designs a 600x600 square, uploads it to S3 by hand, and pastes its CDN URL into the artwork tab. MMDb should take the file directly so the S3 console and the copy and paste step drop out.

## What Changes

- The show edit modal's artwork tab gets a file picker that accepts a JPEG or PNG. Picking a file uploads it straight away and fills the poster URL field with the new `https://cdn.myflix.stream/images/...` URL, and the previews update just as they do when a URL is pasted.
- A new upload endpoint for a show's artwork stores the file in the existing `myflix-stream` bucket under `images/`, with a random name, and answers with the public URL. Only the signed-in owner of the show can use it.
- The endpoint rejects files that aren't actually JPEG or PNG (judged by their bytes) and files over 5 MB, and stores nothing in those cases.
- Saving is unchanged: the existing Save already writes the URL field to the season and copies it to the show. Pasting a URL keeps working.
- New dependency: the `aws-sdk-s3` gem. New server settings: AWS credentials for an IAM user limited to `PutObject` on `myflix-stream/images/*`, plus the bucket name and region.

Out of scope: movie posters, resizing or cropping (the owner designs the squares), deleting replaced artwork from S3, and the myflix front end, which already displays whatever URL is stored.

## Capabilities

### New Capabilities
- `show-artwork`: how a show's and season's artwork can be replaced by uploading an image file, which files are accepted, where they are stored, and who may upload.

### Modified Capabilities

None. The collection grid's poster rules in `show-collection` are unaffected, since an uploaded poster is stored as an ordinary URL.

## Impact

- `app/views/partials/_edit_show.erb` (artwork tab) and `public/js/mmdb.js` (upload, then fill the field and refresh the previews).
- `app/controllers/users_shows_controller.rb`: a new upload route.
- A new storage helper that talks to S3.
- `Gemfile` and `Gemfile.lock`: `aws-sdk-s3`.
- `spec/`: request specs with S3 stubbed through WebMock; `spec_helper` gets fixed test values for the new settings.
- Server: four new `.env` keys, which the owner adds, and a container rebuild for the new gem.
- AWS: a new IAM user and policy, which the owner creates.
