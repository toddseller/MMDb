# Tasks

## 1. Setup

- [x] 1.1 Add `gem 'aws-sdk-s3'` to the Gemfile, run `bundle install`, and verify `bundle exec rspec` still passes with the lock file updated
- [x] 1.2 Add fixed fake values for `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION=us-west-2` and `ARTWORK_BUCKET=myflix-stream` to `spec/spec_helper.rb`'s test settings, and verify the suite passes

## 2. Upload endpoint (test-first)

- [x] 2.1 Write `spec/artwork_upload_spec.rb` covering the "Owner uploads show artwork" scenarios: JPEG and PNG, with WebMock asserting the S3 PUT key, body and content type; unique URLs; posters unchanged. Run it and show it failing because the route doesn't exist, then add the `Artwork` module and the `POST /users/:user_id/shows/:id/artwork` route until it passes
- [x] 2.2 Add specs for "Only the show's owner can upload" (not signed in, another user's show, another user's URL), asserting 401 and no S3 request. Show them failing, then add the ownership check until they pass
- [x] 2.3 Add specs for the rejection and storage-failure scenarios (disguised text file, over 5 MB, no file, S3 answering 403 or 500), asserting the status, message, no S3 request where relevant, and no credential values in the body. Show them failing, then add the byte, size and error handling until they pass
- [x] 2.4 Check what a cross-origin `POST` to the upload route gets with a valid session (a spec with `HTTP_ORIGIN` set to another site), and record the result in design.md; if it isn't refused, note it as a follow-up change rather than fixing it here
- [x] 2.5 Run the whole suite and verify it passes with coverage reported

## 3. Artwork tab

- [x] 3.1 Add a view spec asserting that the edit modal's artwork tab has a file input with `accept="image/jpeg,image/png"`, a message element, and still the `season[poster]` field. Show it failing, then add the elements to `_edit_show.erb` until it passes
- [x] 3.2 Add the upload handler to `public/js/mmdb.js` (FormData post, then fill the field and trigger `change` on success, or show the message with `.text()` on failure) and run the whole suite
- [x] 3.3 Visual check in the browser against a local server with S3 stubbed or a test bucket: picking a file updates the previews, a rejected file shows its message, and Save stores the URL on the season and the show

## 4. Integration

- [x] 4.1 Run `openspec validate add-show-artwork-upload --strict` and the full suite, and verify both pass

## Workflow follow-up

- The owner creates the `mmdb-artwork` IAM user with the `PutObject`-only policy and adds the four `.env` keys on the server without echoing them (design.md, Migration Plan).
- Archive the change as the last commit of the change's PR, and open the PR with `gh`.
- After merge: deploy with `git pull --ff-only && docker compose up -d --build`, upload one real square, open its URL, save, and check the grid tile.
