# Proposal

## Why

The report-only Content-Security-Policy logged a `media-src` violation on `/users/1/shows`: an Apple episode image (`…PreviewImage_preview_image_397000_video_sdr…/300x169.jpg`) loaded as a video. The episode picker shown when adding a season puts a preview in a `<video>` element whenever its URL contains the text `video`, a branch left from 2018 when Apple served video previews. Every preview the picker gets today is an image (a TMDB still, an Apple preview frame or keyframe, or empty), so the branch only fires by accident on Apple images whose file names contain `video`, and those episodes show an empty box. Both loops in the picker also skip episodes whose preview is `'NA'`, a value nothing in the app produces.

## What Changes

- `_episodes_preview.erb` always shows each episode's preview as an `<img>` with the existing fallback artwork; the `<video>` branch is removed.
- The two `'NA'` checks in the same partial are removed. Episodes render and are added exactly as now, since no episode has that value.
- Not in this change: the same unused `'NA'` check in `_preview.erb`, `_shows_preview.erb` and `_update_preview.erb` (movie and show search), left for a later cleanup.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `adding-to-collection`: the season's episode list shows each episode's artwork as an image, with the fallback when there is none or it fails.

## Impact

- `app/views/partials/_episodes_preview.erb` only.
- Tests: a new request spec for the picker's markup.
- The CSP's `media-src` report stops without loosening the policy.
- Stored episodes are unaffected: the picker renders fresh lookup results, and no other MMDb view shows an episode's preview.
