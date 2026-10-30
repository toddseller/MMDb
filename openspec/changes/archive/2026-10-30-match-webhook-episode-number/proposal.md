# Proposal

## Why

When Plex reports a single new episode, the import fetches exactly that episode from Apple or TMDB, then keeps it only if its title equals Plex's title. Sources spell titles differently, so the import drops real episodes and logs nothing: the US Ghosts season 6 premiere (Plex "Halloween 6: The Mirror (1)", Apple "Halloween 6: The Mirror, Part 1") never arrived, though the Add TV Show flow, which compares no titles, adds it fine.

## What Changes

- A single-episode Plex import keeps the fetched episode when its episode number equals the one Plex reported, whatever its title.
- An episode whose number differs from Plex's is still not added, so a misaligned Apple window can't store the wrong episode.
- The Matlock workaround, which skipped the title check for one show, is removed; the number check covers it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plex-webhook`: adds the requirement that a single-episode import identifies the episode by its number, not its title.

## Impact

- `Show.plex_add` in `app/models/show.rb`, including deletion of the Matlock episode clause (the Matlock year override for show-level events stays).
- `spec/plex_import_spec.rb` gains the mismatched-title and wrong-number cases.
- No API, schema or dependency change.
