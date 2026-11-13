# Tasks

Each task is test-first: write the examples in `spec/plex_import_spec.rb`, run them and show them failing for the right reason, write the smallest code in `app/models/show.rb` that passes, then run the whole suite (`bundle exec rspec`). Payloads with a `Guid` carry IDs for that exact episode, and their TMDB `find/{id}` and `tv/{show_id}` requests are stubbed.

## 1. One show only

- [x] 1.1 Add the "Two candidates left" example: an episode payload without `Guid`, nothing stored, and searches that return two unstored "The Lowdown" shows (Apple 2025, TMDB 1988) with the reported season. Expect no new `Show`, `Season` or `Episode` and a log line naming the title, season and episode. Make it pass with the one-show check and skip log, and verify the existing Plex import examples still pass

## 2. Stored-show fallback

- [x] 2.1 Add the "New season of a stored show" example: 2025 "The Lowdown" stored with season 1, Apple listing its season 2, TMDB listing a 1988 namesake with season 2, and an episode payload for season 2 without `Guid`. Expect season 2 and the episode on the 2025 show and no 1988 show. Make it pass and verify the suite passes
- [x] 2.2 Add the "Only one candidate, nothing stored" example: one unstored show matches and is created with its season and episode as before. Verify it passes without new code, or make it pass, and verify the suite passes

## 3. Picking the show by the episode's IDs

- [x] 3.1 Add the "Namesake that is not stored" example: 2025 "The Lowdown" stored, a payload whose `imdb://` ID `find` places in show 273247 (first aired 2025), and TMDB also listing the 1988 show with the season. Expect the episode on the 2025 show only. Make it pass with the `find` and `tv/{show_id}` lookup and verify the suite passes
- [x] 3.2 Add the "Two stored namesakes" example: "The Office" stored as 2001 (Apple ID) and 2005 (TMDB ID), and a payload `find` places in the 2005 show. Expect the episode on the 2005 show only, and verify the suite passes
- [x] 3.3 Add an example where the `imdb://` ID finds no episode and the `tvdb://` ID does. Expect the show picked from the TVDB answer, and verify the suite passes
- [x] 3.4 Add the "Show on both Apple and TMDB" example: nothing stored, Apple and TMDB both list the found show, and the import creates the show, season and episode from Apple's rows. Verify the suite passes
- [x] 3.5 Add the "TMDB can't be reached" example: `find` answers with a 500 (or the request times out), one candidate is stored, and the episode lands on it. Verify through the webhook spec that the response is still 204, and verify the suite passes

## 4. Show-level year

- [x] 4.1 Add the "Plex dates the show a year later" and "Namesake decades apart" examples: show events for "Matlock" with years 2025 and 1986, and searches listing Matlock (2024, Apple) and Matlock (1986, Apple), each with season 1. Expect the season imported from the matching year only. Show the 2025 example failing, then replace `==` with `Match.same_year?` in the show-level condition, delete the `matlock` line, and verify the suite passes

## Workflow follow-up

- Run `ponytail:ponytail-review` on the diff in a fresh subagent before the first commit and wait for the user to pick fixes. Then commit the code, archive the change as a second commit, and open the PR with `gh` from branch `plex-episode-one-show`.
- After the user merges, deploy by tag (`vYYYY.MM.DD.N`).
- Separately, with a one-off script: look up the show with `show_collection_id = '32977'` in production, show the user its seasons, episodes and user links, and delete it only after they confirm.
