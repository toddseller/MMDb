# Design

## Context

- **`Artwork.store(file)`** (`app/models/artwork.rb`):
  - checks for a file;
  - checks the size against 5 MB ("Artwork must be 5 MB or smaller.");
  - reads the first 8 bytes to tell JPEG from PNG;
  - puts the object at `images/<27 random alphanumerics>.<ext>` in `ENV['ARTWORK_BUCKET']` (`myflix-stream`) with the right content type;
  - returns `https://cdn.myflix.stream/` plus the key;
  - turns AWS and network errors into `StoreFailed`, logging only the error's class.
- **Its caller:** `POST /users/:user_id/shows/:id/artwork` maps `Invalid` to 422 and `StoreFailed` to 502. `spec/artwork_upload_spec.rb` asserts its exact messages and stubs `https://myflix-stream.s3.us-west-2.amazonaws.com/images/...` with WebMock.
- **API sign-in:** `Api_v2Controller#authenticate!` decodes the `Authorization: bearer <jwt>` header and halts 401 on any decode error. The user is `User.find(@auth_payload['sub'])`.
- **CORS (`config.ru`):** `/api/v2/*` is open to `localhost:3000`, `myflix-stream.herokuapp.com`, `www.myflix.stream` and `myflix.stream`, for all methods and headers. `Rack::JSONBodyParser` only parses JSON bodies, so multipart reaches `params` as usual.
- **The user record:** `users.avatar` is a string column, default `''`. Sign-in (`/authenticate`, v2 and v3) and v3's `GET /user` return it.
- **AWS:** the `mmdb-artwork` IAM user may only `PutObject` on `myflix-stream/images/*`. cdn.myflix.stream is CloudFront in front of the bucket. A missing key answers 403 in both `images/` and `avatars/` (public listing is off), so whether public reads cover `avatars/` can't be told from outside.

## Goals / Non-Goals

**Goals:**
- One upload path for show artwork and avatars, with identical checks.
- An endpoint Myflix can call with the token it already holds.

**Non-Goals:**
- Resizing or cropping images.
- Removing replaced avatars.
- Account details other than the avatar.

## Decisions

### `Artwork.store(file, folder: 'images', name: 'Artwork')`
- **The keywords:** `folder` picks the key prefix, and `name` fills the size message ("`<name>` must be 5 MB or smaller."). The other messages already read well for either use.
- **Show artwork:** its call is unchanged, so its keys and messages stay byte-for-byte the same, and its spec passes untouched.
- **Alternative: an `Avatar` module copying `Artwork`.** Rejected: two copies of the byte checks and storage error handling that must never drift apart.

### `POST /api/v2/avatar`
```ruby
post '/avatar' do
  authenticate!
  upload = params[:avatar]
  url = Artwork.store(upload.is_a?(Hash) ? upload[:tempfile] : nil, folder: 'avatars', name: 'Avatars')
  User.find(@auth_payload['sub']).update!(avatar: url)
  json avatar: url
rescue Artwork::Invalid => e
  halt 422, json(error: e.message)
rescue Artwork::StoreFailed
  halt 502, json(error: "The avatar couldn't be stored. Try again.")
end
```
- **Order:** the avatar is saved only after the file is stored, so a refused or failed upload leaves it unchanged.
- **The user:** it comes from the token alone. No user id in the path means nobody can name another user.
- **The response key** is `avatar`, which is also the user field Myflix keeps.
- **Alternative: a presigned S3 URL handed to the browser.** Rejected: the bytes would skip MMDb's type check, and the bucket would need CORS for Myflix.

### AWS (owner steps)
1. **The IAM policy:** add `arn:aws:s3:::myflix-stream/avatars/*` to `mmdb-artwork`'s `s3:PutObject` statement, next to `images/*`.
2. **Public reads:** after the first real upload, `curl` its CDN URL. If it's 403, the bucket policy (or CloudFront's) names `images/*` only, and gets `avatars/*` added the same way.

### Tests
`spec/avatar_upload_spec.rb`, modelled on `artwork_upload_spec.rb`:
- **Setup:** WebMock stubs `PUT https://myflix-stream.s3.us-west-2.amazonaws.com/avatars/...`, and requests carry `HTTP_AUTHORIZATION: bearer <JwtAuth.token(user)>`.
- **Successful uploads:**
  - a JPEG and a PNG are stored under `avatars/` with the right content types;
  - the user's avatar is saved and returned;
  - another user's avatar is untouched;
  - the next `/authenticate` returns the new avatar.
- **Refusals:**
  - no token, an expired token and a forged token give 401, with no PUT made;
  - a disguised file, an oversized file and no file give 422 with their messages, the avatar unchanged and no PUT made.
- **Storage failures:** an S3 error and missing credentials give 502, with the avatar unchanged.
- **CORS:** a preflight from `https://myflix.stream` for `POST /api/v2/avatar` allows it.

## Risks / Trade-offs

- [Replaced avatars stay in the bucket forever.] → They're small, and the upload key can't delete, which keeps a leaked key harmless. A cleanup can come later if storage ever matters.
- [The first deploy could precede the IAM change.] → Uploads would answer 502, with nothing broken. The IAM step comes before the release.
- [A 5 MB avatar is larger than it needs to be.] → Same limit as artwork for one code path. The page shows it at 40px, and resizing is out of scope.

## Migration Plan

1. Merge, owner adds `avatars/*` to the IAM policy, then release a `v*` tag.
2. Upload a test avatar through the API and `curl` its CDN URL. If it's 403, the owner adds `avatars/*` to the bucket's public read.
3. Rollback: redeploy the previous tag. The endpoint has no data migration, and avatars already saved remain valid URLs.
