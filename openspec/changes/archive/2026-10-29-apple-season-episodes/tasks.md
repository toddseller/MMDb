# Tasks

## 0. Branch

- [x] 0.1 Create `apple-season-episodes` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Lookups use Apple's current window

- [x] 1.1 In `spec/episode_lookup_spec.rb`, give the stubbed Apple episodes a `seasonNumber`, and add failing examples for a show whose Apple summaries are season 1 with 6 episodes and season 2 with 3, while season 2 is stored with `skip` 5 (from before season 1 gained an episode): `get_episodes` for season 2 fetches `skip=6&count=3` and lists episodes 1 to 3 of season 2; with the summaries request failing, it falls back to `skip=5`. Run them and see the window example fail on `skip=5`.
- [x] 1.2 Add `Show.apple_season_window` and use it in `get_episodes`'s Apple branch. Verify 1.1 passes and the existing lookup examples still pass.

## 2. Only the requested season

- [x] 2.1 Add a failing example: the window's response includes an episode labelled with season 1; it is not listed for season 2. Run it and see it fail.
- [x] 2.2 Add the optional `season_number` filter to `appletv_episodes` and pass it from `get_episodes`. Verify 2.1 passes.

## 3. The Plex webhook and the search refresh

- [x] 3.1 Add failing examples: a Plex report of season 2 episode 2 for the shifted show fetches `skip=7&count=1` and imports season 2's episode 2; a show search refreshes a stored season's count by its season number when Apple's seasons start at 2. Run them and see them fail.
- [x] 3.2 Use the helper in `plex_add`'s Apple branch (whole season and single episode, with the season filter) and in `refresh_apple_count`. Verify 3.1 passes.

## 4. Verify

- [x] 4.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass.
- [x] 4.2 Against the real Apple API, run the new helper for South Park (`umc.cmc.1n9fnkfiemhayikewq5xitzn6`) seasons 28 and 29 and verify it lists S28E1 to E5 and S29E1 to E4.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `apple-season-episodes`, archive the change in the same PR and open it with `gh`. The owner merges and deploys.
- After deploying: the owner picks South Park seasons 28 and 29 and adds S28E4 and S29E4; check the log for errors and `media-src` CSP reports.
