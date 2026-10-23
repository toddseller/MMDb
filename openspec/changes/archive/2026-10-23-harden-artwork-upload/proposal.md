# Proposal

## Why

Two problems turned up during the first artwork deploy. With the AWS keys missing from the container, an upload raised an unhandled error and the user got a 500 error page instead of the "couldn't be stored" message. And after the deploy, the new file picker did nothing until a hard reload, because browsers may keep `/js/mmdb.js` for 4 hours (`max-age=14400`) and its URL never changes.

## What Changes

- An artwork upload that fails because the storage credentials are missing or unusable now answers 502 with the same readable message as any other storage failure.
- The layout links its own scripts and stylesheets with a `?v=` version taken from each file's modification time. Every deploy that changes a file gives it a new URL, so browsers and Cloudflare fetch it fresh.

Out of scope: files that the stylesheets pull in with `@import`, images, and the third-party scripts loaded from other hosts.

## Capabilities

### New Capabilities
- `page-assets`: how pages reference the app's own scripts and stylesheets so a deployed change reaches browsers without a hard reload.

### Modified Capabilities
- `show-artwork`: "Storage failures are reported" gains a scenario for missing credentials.

## Impact

- `app/models/artwork.rb`: also rescue the SDK's credential errors.
- `app/views/layout.erb` plus a small view helper.
- `spec/`: new examples in `artwork_upload_spec.rb`, and a layout spec.
- No new dependencies or settings. The deploy is a pull and a restart.
