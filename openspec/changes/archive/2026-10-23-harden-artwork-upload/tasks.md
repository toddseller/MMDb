# Tasks

## 1. Missing storage credentials

- [x] 1.1 Add a spec in `spec/artwork_upload_spec.rb` that removes the AWS keys from `ENV` (restoring them afterwards), uploads a valid JPEG, and expects 502 with "The artwork couldn't be stored. Try again.", no S3 request, and an unchanged poster. Show it failing with the unhandled credentials error, then rescue the SDK's credential errors in `Artwork.store` until it passes

## 2. Versioned assets

- [x] 2.1 Add a layout spec asserting that a rendered page's `/js/` scripts and `/css/` stylesheet carry `?v=<version>`, that the version changes after a file's modification time changes, and that it is the same across two renders. Show it failing, then add an `asset_path` view helper and use it in `app/views/layout.erb` until it passes

## 3. Integration

- [x] 3.1 Run the whole suite and `openspec validate harden-artwork-upload --strict`, and verify both pass

## Workflow follow-up

- Archive the change as the last commit of the change's PR, and open the PR with `gh`.
- After merge: `cd ~/MMDb && git pull --ff-only && docker compose restart web` (no gem or `.env` changes). Then check that the live page's script URLs carry `?v=`.
