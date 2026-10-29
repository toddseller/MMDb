# Proposal

## Why

Apple serves a show's episodes as one list across all seasons, and MMDb stores each Apple season as a window into it: `skip` (where the season starts) and `count`. When Apple later inserts an episode into an earlier season, every later window starts too early. South Park shows it today: Apple added "Imaginationland: The Trilogy" to season 11, so stored seasons 26 to 29 each start one episode early. Picking season 29 lists S28E5 plus S29E1 to E3 and leaves out S29E4. Searches refresh a stored season's `count` from Apple but never its `skip`, and the stored `skip` is what every episode lookup uses: the season picker, MyFlix's `/api/v2` and `/api/v3` add-episodes endpoints, and the Plex webhook, which for a single episode reads one position past the stored `skip` and would fetch the wrong episode, then skip it because the title doesn't match.

## What Changes

- Apple episode lookups work out the season's current window from Apple's season summaries at lookup time, the way a new season's window is already worked out, instead of trusting the stored `skip`. The stored values are the fallback if Apple's summaries can't be read.
- Lookups keep only episodes Apple labels with the requested season number, so a window that is still off can't list another season's episode.
- The count refresh during a search finds the season by its number in Apple's season list rather than assuming seasons are numbered 1, 2, 3 in order.
- One shared helper does this for the picker, both APIs and the Plex webhook.
- Not in this change: rewriting stored `skip` values, and adding South Park's missing S28E4 and S29E4, which the owner adds through the picker once this ships.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `episode-lookup`: adds that Apple lookups follow Apple's current season layout and list only the requested season's episodes.

## Impact

- `app/models/show.rb`: `get_episodes`, `appletv_episodes`, `refresh_apple_count`, `plex_add`'s Apple branch, and one new helper.
- Callers (`users_shows_controller.rb`, `api_v2_controller.rb`, `api_v3_controller.rb`) keep their signatures.
- One more Apple request per episode lookup (the season summaries), the same request a search already makes per stored season.
- Tests: `spec/episode_lookup_spec.rb` and its stubs.
