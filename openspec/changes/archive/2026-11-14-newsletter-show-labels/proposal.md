# Proposal

## Why

Each poster in the newsletter now ends in a bar joined to it, and on a phone the bar is about 98 to 107px wide. A label such as "Season 2, 2 new episodes" wraps onto two lines there, so the bars in a row no longer line up. Show cards also open the show in Plex even when the news is a new season, which leaves the reader to find it.

## What Changes

- A show's label is one short phrase that always fits on one line: "New series" when the whole show was added, "New season" when a whole season was added, otherwise the number of episodes added ("8 episodes", "1 episode"). It no longer names seasons or combines phrases.
- A show card links to the season it is about: the season added whole, or else the season of the newest added episode. A new series still links to the show.
- Every card ends in a bar joined flush under its poster: a show's label in the template's accent colour, or "▶ Play" for a movie in the template's quieter colour (near-black in the regular template, pine green at Christmas). A title without a poster shows a grey 2:3 placeholder image hosted on cdn.myflix.stream, so its bar lines up with its neighbours' in every client, Outlook included.
- The issue's hero is picked at random from the titles that have a TMDB backdrop, instead of being the newest addition.

## Capabilities

### New Capabilities

### Modified Capabilities
- `weekly-newsletter`: show card labels become a single phrase that fits one line, and show cards link to the season rather than the show.

## Impact

- `newsletter/src/group.ts`: the label rule, and each show group carries the key it links to.
- `newsletter/src/cards.ts`: the random hero, and show links built from the season key.
- `newsletter/src/emails/_parts.tsx`: the bar under every poster.
- Tests in `newsletter/test/`. No new requests to Tautulli or TMDB.
