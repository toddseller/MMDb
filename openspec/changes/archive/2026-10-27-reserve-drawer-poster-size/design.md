# Design

## Context

- The movie drawer (`_info.erb`) and the show drawer (`_show_info.erb`) both render their poster as `.description-poster img` inside `#meta-data`. The show's sits under `#info-header`.
- `#meta-data .description-poster img` (theme `modals.css`, 340px) matches both posters. The show's `#info-header > .description-poster img` (theme `movies.css`, 447px) has the same specificity and wins only because it loads later. Any new rule has to keep that order.
- `responsive.css` loads last. It sets `height: auto` on both posters, which is why the dark theme's `height: 447px` never applies, and below 768px it caps both at `max-width: 100%`.
- The grid tile's `<img>` shows `movie.thumbnail` or `show.thumbnail`. For Apple art that is a smaller copy of the drawer's full poster; for any other host it is the same URL. Either way the browser already holds it when the tile is clicked.
- `drawer.js` fills the drawer in `insert` (open, row switch) and `swap` (same row, `keepOpen` after adding episodes). It listens for `load` inside the drawer so it can `reveal` as the poster grows. `show-edit.js`'s `showSaved` replaces the drawer's content after a season switch or an edit save, and points the tile at the new thumbnail.

## Goals / Non-Goals

**Goals:**
- The poster box never depends on the image, at any width.
- The placeholder only ever uses images already on screen, so it needs no new requests, data or server work.

**Non-Goals:**
- A fade from the placeholder to the poster.
- Generated placeholders (BlurHash, dominant colour), which would need a stored value per poster and a backfill.

## Decisions

**A fixed `aspect-ratio`, not `auto`, with `object-fit: contain`.** One rule in `drawer.css` gives both posters `aspect-ratio: 2 / 3; object-fit: contain`. The show rule after it overrides with `aspect-ratio: 1`, using the same selectors as the theme rules so the existing order still decides. The width stays where it is (340px, 447px, `max-width: 100%` on a phone) and `height: auto` follows from the ratio. `auto 2 / 3` would switch to the image's own shape on load, and show posters come in two shapes, so the box would still jump for a TMDB portrait. `contain` fits a poster of the other shape whole instead of stretching it; for a matching poster it changes nothing. The rule also sets `display: block`: Chrome draws a failed or empty `<img>` as its inline alt text and ignores the width and ratio, so without it the box would shrink to a line of text when a poster fails. The alternatives were a fixed height (it squeezes square art on a phone) and choosing the ratio per host on the server (it has to guess for uploaded art); both were rejected in exploration.

**The placeholder is set from JS, not rendered by ERB.** One small exported helper in `drawer.js` takes the drawer's content and an image URL. It sets that URL as the drawer poster's `background-image`, and removes it on the poster's `load` (`{ once: true }`). `insert` and `swap` call it with the clicked tile's `<img>` `src`. `showSaved` reads the old drawer poster's `src` before replacing the content, then calls it with that. Doing this in the browser:
- uses exactly the URL the browser already holds, including the tile's fallback image if its own failed;
- covers the season switch, where only the browser knows what was on screen;
- keeps a stored, owner-entered URL out of an HTML `style` attribute. The value is set through `style.backgroundImage` with the URL as a quoted CSS string (`JSON.stringify`), where a malformed value is simply dropped rather than read as more CSS.

`background-size: contain`, `background-position: center` and `no-repeat` live in `drawer.css` beside the box, so the placeholder sits exactly where the poster will.

**Cleared on `load`, kept on `error`.** Clearing on load stops a square placeholder showing in a portrait poster's side bands. If the full poster fails, the placeholder stays, which is better than a broken image.

**Theme colours stay in the themes.** The default theme's movie poster already has `background-color: #000`. Its show rule's `background: none` becomes the same colour, and the dark theme gets `#222`, its existing panel colour, on both rules. The dark theme's dead `height: 447px` goes. The import versions in `default.css` and `dark.css` are raised for every file that changes.

**The drawer's `load` → `reveal` listener goes.** It brought the drawer into view as its poster grew on load. The poster was the only image in either drawer, and its box is now fixed, so nothing grows on load any more.

## Risks / Trade-offs

- [The placeholder is the grid-sized image, so it is soft on a high-density screen for a moment] → Intended; it is replaced as soon as the full poster loads.
- [On a season switch the full poster may be the very image the placeholder came from, e.g. both seasons share art] → It loads from cache, and clearing the background then changes nothing visible.
- [A show's tile shows the show's art while its drawer shows the active season's] → For a moment the placeholder can be different art from the poster that replaces it. Accepted; most shows use the same art.
- [The `?v=` import versions must rise or browsers keep the old CSS] → Covered by the existing version test in `spec/detail_drawer_spec.rb`, raised to the new floor.

## Migration Plan

CSS and JS only. It ships with the next tagged deploy, and rolls back by reverting the commit.
