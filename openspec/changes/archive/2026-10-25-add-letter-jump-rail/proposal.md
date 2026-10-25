# Proposal

## Why

A collection shows every title on one long grid, so reaching a title near the end of the alphabet means scrolling past hundreds of posters. A side A to Z index lets a user get to any letter in one tap. It was agreed as the next follow-up to the responsive layout work, ahead of the owner-tools phone layouts.

## What Changes

- Collection grids (a user's movies and shows, another user's collection, and a movie collection's own page) gain a letter rail on the right: `#` for titles starting with a digit or other character, then A to Z.
- On desktop the rail is always shown, running the full height of the window below the top bar, like the rail in Plex's web app.
- On phones the rail appears once the user has scrolled one screen down, and only when the grid is at least three screens tall. It hides again above that point, fades out about 2.5 seconds after scrolling stops, and stays while a finger is on it.
- Choosing a letter scrolls to the first title filed under it, by the same sort name the grid is ordered by (leading The, A or An dropped). The scroll is animated: a far jump moves instantly to just short of the target, then glides the last stretch, so every jump looks the same and posters in between are not loaded. With reduced motion the jump is instant.
- Every letter has the same muted look. A letter with no titles does nothing when chosen.
- On a phone, dragging along the rail moves through letters as the finger moves. On screens 500px tall or less the rail shows every other letter.
- The rail follows the grid when a search, Unwatched, 4K, Clear or Library replaces it.
- An open details drawer closes before the jump.

## Capabilities

### New Capabilities
- `letter-rail`: the side index on collection grids: when it shows, which letters it offers, and how choosing one moves the page.

### Modified Capabilities

None. The rail sits in the existing side margin and does not change any page-layout or collection-filters requirement.

## Impact

- Views: the six tile partials (`_my_movies`, `_movie_list`, `_filtered_list`, `_my_shows`, `_show_list`, `_updated_show_list`) each tag tiles with the tile's letter; the collection pages hold the rail's markup.
- A small helper turns a sort name into its rail letter.
- New `public/js/mmdb/letter-rail.js`, started from `public/js/main.js`; it uses `drawer.js`'s `close`.
- `public/css/responsive.css` (or a sibling stylesheet) places the rail and its phone behaviour.
- Tests: Ruby view specs for the letter tags, a jsdom unit test for the rail, and Playwright checks. The e2e seed needs a larger collection, because the current one is too short to show the rail.
- No API, database or dependency changes.
