# Proposal

## Why

On the shows page the panel's dismiss X does nothing: the letter rail, fixed in the same right gutter and painted above the search band, covers it. The X sits at `top: 87px`, which lands it on the rail's top edge (160px). The movies page escapes only because its layout moves the X to `top: 0`. Owners must open a show's drawer to get rid of the panel.

## What Changes

- The dismiss X sits level with the search box on every page and layout (movies, shows, a show's seasons), clear of the letter rail.
- On the shows page the X moves up to the search row; on the movies page it moves up from below the Library / Unwatched / 4K row to the same place, so both pages match.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `adding-to-collection`: the dismiss requirement gains a scenario that the X works on the shows page, where the letter rail shares its gutter.

## Impact

- `app/views/users/show.erb`, `app/views/movies/show.erb`, `app/views/shows/show.erb` (the X moves out of the panel wrapper into the band).
- `public/css/movies.css` (`#dismiss` position, the band anchors it) and `public/js/mmdb/preview.js` (the per-layout dismiss style goes away).
- `spec/js/preview.test.js` (the shows layout test pins the old position) and `e2e/adding.spec.js` (a shows-page dismiss test).
