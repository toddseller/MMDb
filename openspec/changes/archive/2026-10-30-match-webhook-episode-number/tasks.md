# Tasks

## 1. Match the reported episode by number

- [x] 1.1 In `spec/plex_import_spec.rb`, add a single-episode import where Plex's title ("Chapter 2 (1)") differs from Apple's ("Chapter 2, Part 1") and expect episode 2 stored with Apple's title; run it and verify it fails because nothing is stored
- [x] 1.2 Add a single-episode import where Apple answers the window with episode 3 for Plex's episode 2 and expect no episode stored; verify it passes before the fix (the titles differ too) so it guards the number check
- [x] 1.3 In `Show.plex_add`, replace the episode title comparison and the Matlock clause with `episode[:tv_episode].to_i == episode_number.to_i`, keeping the Matlock year override for show events; verify 1.1 and 1.2 pass
- [x] 1.4 Remove `plex_title` if nothing else calls it (`grep -rn plex_title app spec`), then run the whole RSpec suite and verify it passes

## Workflow follow-up

- Do the work on a branch from a freshly fetched `origin/master`, not on `stable-order`.
- Run `ponytail:ponytail-review` on the diff before the first commit.
- Commit the code, then archive the change as a second commit, `Archive match-webhook-episode-number`, and open one PR.
