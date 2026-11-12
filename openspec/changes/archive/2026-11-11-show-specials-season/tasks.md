# Tasks

Each task is test-first: write the examples, run them and show them failing for the right reason, write the smallest code that passes, then run the whole suite (`bundle exec rspec`, plus `npm run typecheck` and `npm test` once JS or its fixtures change).

## 1. Naming and order

- [x] 1.1 Add model examples: `Season.label(0)` is "Specials" and `Season.label(3)` is "Season 3"; `Season#specials?` is true only for season 0; a show's `seasons` and `Season.sorted_seasons` list seasons 0, 1 and 2 as 1, 2, 0. Make them pass in `season.rb` and `show.rb` and verify the suite passes

## 2. Counting and captions

- [x] 2.1 Add examples: `Show#regular_seasons` leaves out season 0; `season_numbers` and the stored `seasonNumbers` and `seasonCount` ignore season 0 (seasons 0 to 14 give 14), while `episodeCount` still counts season 0's episodes. Make them pass and verify the suite passes
- [x] 2.2 Add examples for `Show#season_caption` covering every `show-collection` "Season label" scenario, including the three specials ones. Make it pass, replace the caption branches in `_my_shows`, `_show_list` and `_updated_show_list` with it, and verify the suite passes, including the grid's same-query-count examples

## 3. Drawer

- [x] 3.1 Add request examples rendering a show's drawer: season buttons are `<button>`s reading "1", "2", "Specials" in that order, each with its season number as `value`; the count line reads "14 seasons, 216 episodes" for seasons 0 to 14, "1 season, 11 episodes" with series line "Season 3" for season 3 plus specials, and "Specials, 4 episodes" for specials only. Make them pass in `_show_info` and verify the suite passes
- [x] 3.2 Add a request example: posting season 0 to the season-switch route makes season 0 active and puts its poster on the show. Update the season-button fixtures in `spec/js/show-edit.test.js`, `season-row.test.js` and `drawer.test.js` to `<button>` markup, fix `setDefaultSeason`'s JSDoc cast, and verify `bundle exec rspec`, `npm run typecheck` and `npm test` pass

## 4. Edit dialog and search results

- [x] 4.1 Add request examples: the edit dialog for a show whose active season is 0 is headed "Specials, 4 episodes selected", with "0" in the season number field; the Add TV Show results label a stored season 0 "Specials" and season 1 "Season 1". Make them pass in `_edit_show` and `_shows_preview` and verify the suite passes

## 5. API and stored counts

- [x] 5.1 Add examples: the v2 and v3 `add_show` replies give `seasonCount` and `seasonNumbers` 14 for a show with seasons 0 to 14. Make them pass and verify the suite passes
- [x] 5.2 Add a migration that resaves every show with a season 0, with an example that runs its `up` on a show whose stored `seasonCount` is "15" and checks it becomes "14". Verify the suite passes

## 6. End to end

- [x] 6.1 Update `e2e/shows.spec.js` to check `#active-season` with `toHaveAttribute('value', ...)` instead of `toHaveValue`, add a check that a show with specials lists Specials last, and verify `npx playwright test` passes
- [x] 6.2 Render the drawer of a show with seasons 1 to 3 and specials in both themes, at desktop and phone widths, and get the user's approval of the screenshots before committing

## Workflow follow-up

- Work on a feature branch from a freshly fetched `origin/master`. Run `ponytail:ponytail-review` on the diff before the first commit, then commit the code, archive the change as a second commit, and open the PR with `gh`.
- After the user merges, deploy by tag. Check MythBusters on mmdb.online: Specials last in its season row, the drawer reading "14 seasons, 216 episodes", and its tile reading "14 seasons".
- Myflix's own handling of season 0 is a separate change in the Myflix repo.
