# Tasks

## 1. Delete the replaced movie

- [x] 1.1 In `spec/plex_library_spec.rb`, change the replacement specs to the new scenarios and add failing ones: "Replacement found" (row and the owner's rating deleted, output "Deleted movie: Madden (2023)"), "Another user has the replaced movie" (row kept, Plex ID cleared, output "Removed movie: Madden (2023)"); keep "Search finds nothing" passing
- [x] 1.2 In `PlexLibrary.sync_movie`, after removing the owner, delete the row and its ratings when no other user has it, and print "Deleted movie" or "Removed movie" to match. Verify the 1.1 specs and the whole suite pass
- [x] 1.3 Update the "Plex sync" section of `DOCKER_DEPLOYMENT.md` to say the replaced movie is deleted unless another user has it, and verify it names the same output lines the code prints

## Workflow follow-up

- Run the `ponytail:ponytail-review` skill on the uncommitted diff in a fresh subagent before the first commit.
- Commit the code, then archive the change as `Archive delete-replaced-plex-movies` in the same PR.
- After the deploy, the next wrong match the sync replaces should show "Deleted movie" in `journalctl --user -u mmdb-plex-sync` on onyx.
