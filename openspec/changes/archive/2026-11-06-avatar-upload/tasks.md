# Tasks

Each code task is test-first: write the spec, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`bundle exec rspec`). Tasks marked **(owner)** are done by the owner, with a walkthrough.

## 1. One upload path

- [x] 1.1 Give `Artwork.store` `folder:` (default `images`) and `name:` (default `Artwork`) keywords; verify `spec/artwork_upload_spec.rb` passes unchanged, and a new example that `Artwork.store(file, folder: 'avatars', name: 'Avatars')` puts to `avatars/` and names "Avatars" in its size message

## 2. The endpoint

- [x] 2.1 Add `POST /api/v2/avatar`: authenticate, store under `avatars/`, save the URL on the token's user, answer `{avatar: url}`; verify `spec/avatar_upload_spec.rb` for a JPEG and a PNG (keys, content types, saved and returned URL, other users untouched) and the next `/authenticate` returning the new avatar
- [x] 2.2 Verify the refusals in the same spec: 401 for no, expired or forged tokens; 422 for a disguised, oversized or missing file; 502 for a storage error and for missing credentials; in each case no avatar change, and no PUT where nothing should be stored
- [x] 2.3 Verify a CORS preflight from `https://myflix.stream` for `POST /api/v2/avatar` with an `Authorization` header is allowed

## 3. AWS and release

- [x] 3.1 **(owner)** Add `arn:aws:s3:::myflix-stream/avatars/*` to the `mmdb-artwork` IAM user's `s3:PutObject` statement, next to `images/*`
- [ ] 3.2 **(owner)** Release a `v*` tag after merging; then upload a test avatar through the API and `curl` its cdn.myflix.stream URL, adding `avatars/*` to the bucket's public read if it answers 403

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- Commit the code, then archive this change with spec sync as a second commit, `Archive avatar-upload`, on the same branch, before opening the PR. A fix found after that goes on top as a new commit.
