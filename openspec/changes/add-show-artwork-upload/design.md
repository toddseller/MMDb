# Design

## Context

- The artwork tab (`app/views/partials/_edit_show.erb`) is a single `season[poster]` text field. Changing it only refreshes the previews (`updatePoster` in `public/js/mmdb.js`). Saving sends the edit forms through the existing `PUT /users/:user_id/shows/:id`, and the JS appends `show[poster]` from the same field, so one value sets both the season poster and the show poster.
- Existing squares live at `s3://myflix-stream/images/<name>.jpg` in `us-west-2`. Objects there can be read publicly, and `https://cdn.myflix.stream/images/<name>.jpg` serves the same object through Cloudflare and CloudFront.
- MMDb has no AWS SDK or credentials today. Pages use jQuery 1.9.1, and sign-in is a Sinatra session cookie (`current_user`). Tests run under WebMock with no network access.

## Goals / Non-Goals

**Goals:**
- The upload is a separate step that returns a URL; the save path stays exactly as it is.
- The new endpoint is the only code holding AWS credentials, and it does no more than put one object.

**Non-Goals:**
- Tightening the existing edit and save routes, which don't check ownership today. That is a separate change; this one only makes sure the new route checks it.
- Image processing of any kind.

## Decisions

### Upload first, save later
`POST /users/:user_id/shows/:id/artwork` (multipart, field `artwork`) stores the file and answers `{ url }`. The JS puts the URL in `season[poster]` and triggers `change`, so the existing `updatePoster` refreshes the previews, and the normal Save persists it.
*Alternative:* sending the file with Save, inside the existing PUT. That would mean turning a URL-encoded form post that four handlers share into multipart, and the user would see no preview before saving. Rejected.
*Trade-off:* an upload that is never saved leaves an unused object in S3. At a few hundred kilobytes each, that's acceptable.

### Storage helper in `app/models`
A small `Artwork` module (next to `JwtAuth`) with one public call, `Artwork.store(tempfile)`. It returns the public URL or raises `Artwork::Invalid` with the user-facing message. Inside, it:
1. Reads the first 8 bytes: `FF D8 FF` means JPEG, `89 50 4E 47 0D 0A 1A 0A` means PNG, and anything else is invalid. The size is checked against 5 MB.
2. Names the object `images/#{SecureRandom.alphanumeric(27)}.jpg` (or `.png`). The 27 characters look like TMDB's file names, and the collision odds are negligible.
3. Calls `Aws::S3::Client#put_object` with `bucket`, `key`, `body` and `content_type`. It sends no ACL, because the bucket's policy already makes `images/` readable, and a bucket with object ownership enforced would reject ACLs anyway.

The route maps `Artwork::Invalid` to 422 and `Aws::S3::Errors::ServiceError` or network errors to 502 with a fixed message. The route logs the error class, never its message, since that message can contain request details.

### `aws-sdk-s3` rather than hand-signed requests
SigV4 signing by hand would avoid a gem, but it is security-sensitive code to own. The SDK uses Net::HTTP, which WebMock intercepts, so the tests stub `PUT https://myflix-stream.s3.us-west-2.amazonaws.com/images/...` and assert on the body and content type, the same way the other external calls are tested. The SDK reads `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_REGION` from the environment by itself. The bucket comes from `ARTWORK_BUCKET`, and the URL base is a constant, `https://cdn.myflix.stream/`.

### Ownership check
Before reading the file, the route runs `halt 401 unless current_user && current_user.id == params[:user_id].to_i && current_user.shows.exists?(params[:id])`. Saved posters are only written through the existing PUT, which this change leaves alone.

### Front end
In the artwork tab, an `<input type="file" accept="image/jpeg,image/png">` and a message element sit under the URL field. On `change`, `mmdb.js` posts a `FormData` with `$.ajax({ processData: false, contentType: false })`, which jQuery 1.9 supports. On success it sets the field and triggers `change`; on failure it shows `responseJSON.error`, falling back to a generic message. Any message text is set with `.text()`, never `.html()`.

## Risks / Trade-offs

- [The access key leaks] → The IAM user can only `s3:PutObject` on `arn:aws:s3:::myflix-stream/images/*`. It can't read, list or delete anything, and its key lives only in the server's `.env`. Tests use fixed fake values from `spec_helper`, and failure output never prints them.
- [Cross-site posts to the upload route] → The route needs the owner's session cookie, and it is protected the same way as every other form post in the app, with no new CSRF layer. Checked in task 2.4: a POST carrying another site's `Origin` reaches the app with the session dropped by Sinatra's rack-protection, even though `remote_token` is turned off in `config.ru`. The ownership check then answers 401 and nothing is stored, and the drop is persisted, so the owner is also signed out. A same-origin `Origin` and a missing `Origin` both keep the session. `spec/artwork_upload_spec.rb` pins this behavior, so no follow-up change is needed.
- [A large upload ties up a Puma thread] → The 5 MB limit is enforced after Rack has buffered the upload to a tempfile on disk, not in memory. This is acceptable for an app with one owner.
- [Replaced artwork stays in S3] → Accepted. Cleanup is out of scope.
- [The bucket requires a header we don't send] → The existing objects use AES256, which is S3's default encryption, so no header is needed. The first real upload after deploy confirms it (see Migration Plan).

## Migration Plan

1. The owner creates IAM user `mmdb-artwork` with the inline policy `{"Effect":"Allow","Action":"s3:PutObject","Resource":"arn:aws:s3:::myflix-stream/images/*"}` and creates an access key.
2. On the server, the owner adds `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION=us-west-2` and `ARTWORK_BUCKET=myflix-stream` to `~/MMDb/.env` without echoing them.
3. After merge: `cd ~/MMDb && git pull --ff-only && docker compose up -d --build`. `--build` is needed for the new gem, and `up -d` recreates the container so the new `.env` keys load.
4. Upload one square through the artwork tab, open the returned URL, save, and check the grid tile.
5. To roll back, revert the merge and run `docker compose up -d --build`. Stored URLs keep working, because the files stay in S3.
