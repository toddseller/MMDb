# Proposal

## Why

When a season's artwork is a vertical (2:3) poster, the show edit dialog's Artwork tab draws it 450px wide and about 675px tall, taller than the dialog's fixed 600px body. The image spills over the footer and the dialog clips it, so the Upload button, the poster URL field, and OK and Cancel can't be reached or clicked.

## What Changes

- The Artwork tab's preview image is capped in height, and a vertical poster is shown whole, scaled down and centred within the tab's full width.
- Landscape and square artwork that already fits looks the same as it does now.
- Out of scope: the dialog's fixed 800px height in browser windows shorter than that (explored as option C, not chosen).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `show-artwork`: adds the requirement "The artwork preview fits the Artwork tab". Artwork of any shape is shown whole, and the Upload button, the URL field and the dialog's buttons stay usable.

## Impact

- `public/css/modals.css`: the `#artwork img` rule.
- `e2e/artwork.spec.js`: a new test with a vertical poster.
- No server, API or data changes.
